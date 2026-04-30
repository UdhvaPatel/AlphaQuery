const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// ── Persistence ──────────────────────────────────────────────────────────────

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { squads: {}, members: {}, contributions: {}, reactions: {} };
  }
}

function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Single writer lock via synchronous I/O — fine for a single-process demo
function withDB(fn) {
  const db = load();
  const result = fn(db);
  save(db);
  return result;
}

function readDB(fn) {
  return fn(load());
}

// ── Query helpers (same surface as before) ───────────────────────────────────

const queries = {
  createSquad: {
    run({ id, name, goal_description, target_amount, deadline, invite_code }) {
      withDB(db => {
        if (Object.values(db.squads).some(s => s.invite_code === invite_code)) {
          throw Object.assign(new Error('UNIQUE constraint'), { message: 'UNIQUE' });
        }
        db.squads[id] = {
          id, name, goal_description, target_amount: parseFloat(target_amount),
          current_amount: 0, deadline: deadline || null,
          invite_code, created_at: new Date().toISOString(), goal_achieved: 0,
        };
      });
    },
  },

  getSquadByInviteCode: {
    get(code) {
      return readDB(db => Object.values(db.squads).find(s => s.invite_code === code) || null);
    },
  },

  getSquadById: {
    get(id) {
      return readDB(db => db.squads[id] || null);
    },
  },

  createMember: {
    run({ id, squad_id, name, color }) {
      withDB(db => {
        db.members[id] = { id, squad_id, name, color, joined_at: new Date().toISOString() };
      });
    },
  },

  getMember: {
    get(id) {
      return readDB(db => db.members[id] || null);
    },
  },

  getMembersBySquad: {
    all(squad_id) {
      return readDB(db => {
        const members = Object.values(db.members).filter(m => m.squad_id === squad_id);
        const contribs = Object.values(db.contributions).filter(c => c.squad_id === squad_id);
        return members.map(m => ({
          ...m,
          total_contributed: contribs.filter(c => c.member_id === m.id).reduce((s, c) => s + c.amount, 0),
        })).sort((a, b) => b.total_contributed - a.total_contributed);
      });
    },
  },

  createContribution: {
    run({ id, squad_id, member_id, member_name, amount, message }) {
      withDB(db => {
        db.contributions[id] = {
          id, squad_id, member_id, member_name,
          amount: parseFloat(amount), message: message || null,
          created_at: new Date().toISOString(),
        };
      });
    },
  },

  updateSquadAmount: {
    run(amount, _amount2, squad_id) {
      withDB(db => {
        if (!db.squads[squad_id]) return;
        db.squads[squad_id].current_amount += parseFloat(amount);
        if (db.squads[squad_id].current_amount >= db.squads[squad_id].target_amount) {
          db.squads[squad_id].goal_achieved = 1;
        }
      });
    },
  },

  getContribution: {
    get(id) {
      return readDB(db => db.contributions[id] || null);
    },
  },

  getContributionsBySquad: {
    all(squad_id) {
      return readDB(db =>
        Object.values(db.contributions)
          .filter(c => c.squad_id === squad_id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
    },
  },

  upsertReaction: {
    run({ contribution_id, emoji }) {
      withDB(db => {
        const key = `${contribution_id}__${emoji}`;
        if (db.reactions[key]) {
          db.reactions[key].count += 1;
        } else {
          db.reactions[key] = { contribution_id, emoji, count: 1 };
        }
      });
    },
  },

  getReactionsByContribution: {
    all(contribution_id) {
      return readDB(db =>
        Object.values(db.reactions).filter(r => r.contribution_id === contribution_id)
      );
    },
  },

  getReactionsByContributions: {
    all(squad_id) {
      return readDB(db => {
        const contribIds = new Set(
          Object.values(db.contributions).filter(c => c.squad_id === squad_id).map(c => c.id)
        );
        return Object.values(db.reactions).filter(r => contribIds.has(r.contribution_id));
      });
    },
  },

  getLeaderboard: {
    all(squad_id) {
      return readDB(db => {
        const members = Object.values(db.members).filter(m => m.squad_id === squad_id);
        const contribs = Object.values(db.contributions).filter(c => c.squad_id === squad_id);
        return members.map(m => ({
          ...m,
          total_contributed: contribs.filter(c => c.member_id === m.id).reduce((s, c) => s + c.amount, 0),
          contribution_count: contribs.filter(c => c.member_id === m.id).length,
        })).sort((a, b) => b.total_contributed - a.total_contributed);
      });
    },
  },
};

module.exports = { queries };
