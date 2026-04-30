const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queries } = require('./database');

const router = express.Router();

const MEMBER_COLORS = [
  '#7C3AED', '#0D9488', '#DC2626', '#D97706', '#059669',
  '#2563EB', '#7C3AED', '#DB2777', '#65A30D', '#0891B2',
];

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// POST /api/squads — create squad
router.post('/squads', (req, res) => {
  try {
    const { name, goal_description, target_amount, deadline } = req.body;
    if (!name || !target_amount) {
      return res.status(400).json({ error: 'name and target_amount are required' });
    }

    const id = uuidv4();
    let invite_code = generateInviteCode();

    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 10) {
      try {
        queries.createSquad.run({ id, name, goal_description, target_amount: parseFloat(target_amount), deadline, invite_code });
        break;
      } catch (e) {
        if (e.message.includes('UNIQUE')) {
          invite_code = generateInviteCode();
          attempts++;
        } else throw e;
      }
    }

    const squad = queries.getSquadById.get(id);
    res.json({ squad });
  } catch (err) {
    console.error('Create squad error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/squads/invite/:code — get squad by invite code
router.get('/squads/invite/:code', (req, res) => {
  try {
    const squad = queries.getSquadByInviteCode.get(req.params.code.toUpperCase());
    if (!squad) return res.status(404).json({ error: 'Squad not found' });
    res.json({ squad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/squads/:id — get squad by id with members + contributions
router.get('/squads/:id', (req, res) => {
  try {
    const squad = queries.getSquadById.get(req.params.id);
    if (!squad) return res.status(404).json({ error: 'Squad not found' });

    const members = queries.getMembersBySquad.all(squad.id);
    const contributions = queries.getContributionsBySquad.all(squad.id);
    const reactions = queries.getReactionsByContributions.all(squad.id);

    // Map reactions to contributions
    const reactionMap = {};
    reactions.forEach(r => {
      if (!reactionMap[r.contribution_id]) reactionMap[r.contribution_id] = [];
      reactionMap[r.contribution_id].push({ emoji: r.emoji, count: r.count });
    });

    const contributionsWithReactions = contributions.map(c => ({
      ...c,
      reactions: reactionMap[c.id] || [],
    }));

    res.json({ squad, members, contributions: contributionsWithReactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/squads/:id/join — join squad
router.post('/squads/:id/join', (req, res) => {
  try {
    const squad = queries.getSquadById.get(req.params.id);
    if (!squad) return res.status(404).json({ error: 'Squad not found' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = uuidv4();
    const members = queries.getMembersBySquad.all(squad.id);
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];

    queries.createMember.run({ id, squad_id: squad.id, name, color });
    const member = queries.getMember.get(id);

    res.json({ member });
  } catch (err) {
    console.error('Join squad error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/squads/:id/contribute — add contribution
router.post('/squads/:id/contribute', (req, res) => {
  try {
    const squad = queries.getSquadById.get(req.params.id);
    if (!squad) return res.status(404).json({ error: 'Squad not found' });

    const { member_id, amount, message } = req.body;
    if (!member_id || !amount) return res.status(400).json({ error: 'member_id and amount are required' });

    const member = queries.getMember.get(member_id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const parsedAmount = parseFloat(amount);
    const id = uuidv4();

    queries.createContribution.run({
      id, squad_id: squad.id, member_id, member_name: member.name,
      amount: parsedAmount, message: message || null,
    });

    const wasAchieved = squad.goal_achieved;
    queries.updateSquadAmount.run(parsedAmount, parsedAmount, squad.id);

    const updatedSquad = queries.getSquadById.get(squad.id);
    const contribution = queries.getContribution.get(id);

    const result = {
      contribution: { ...contribution, reactions: [] },
      squad: updatedSquad,
      goalJustAchieved: !wasAchieved && updatedSquad.goal_achieved,
      member: { ...member, color: member.color },
    };

    res.json(result);

    // Emit after sending HTTP response — req.io is attached by app-level middleware
    req.io.to(`squad:${squad.id}`).emit('contribution-added', {
      contribution: result.contribution,
      squad: result.squad,
      member: result.member,
    });
    if (result.goalJustAchieved) {
      req.io.to(`squad:${squad.id}`).emit('goal-achieved', { squad: result.squad });
    }
  } catch (err) {
    console.error('Contribute error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contributions/:id/react — add reaction
router.post('/contributions/:id/react', (req, res) => {
  try {
    const { emoji } = req.body;
    const VALID_EMOJIS = ['🔥', '💪', '🎉', '❤️', '👏'];
    if (!emoji || !VALID_EMOJIS.includes(emoji)) {
      return res.status(400).json({ error: 'Invalid emoji' });
    }

    queries.upsertReaction.run({ contribution_id: req.params.id, emoji });
    const reactions = queries.getReactionsByContribution.all(req.params.id);
    const contribution = queries.getContribution.get(req.params.id);
    const squadId = contribution?.squad_id;

    res.json({ reactions, contribution_id: req.params.id, squad_id: squadId });

    if (squadId) {
      req.io.to(`squad:${squadId}`).emit('reaction-updated', {
        contribution_id: req.params.id,
        reactions,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/squads/:id/leaderboard
router.get('/squads/:id/leaderboard', (req, res) => {
  try {
    const leaderboard = queries.getLeaderboard.all(req.params.id);
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
