import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import Home from './components/Home';
import SquadDashboard from './components/SquadDashboard';
import CelebrationScreen from './components/CelebrationScreen';

const API = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

const DEMO_MEMBERS = ['Alex Chen', 'Sarah Kim', 'Jordan Lee', 'Maya Patel'];
const DEMO_STEPS = [
  { mi: 0, amount: 120, message: "Starting strong! 💪" },
  { mi: 1, amount: 100, message: "Dream trip loading... ✈️" },
  { mi: 2, amount: 150, message: "Count me in! 🙌" },
  { mi: 3, amount: 130, message: "Saving up! 🏝️" },
  { mi: 0, amount: 175, message: "Adding more fuel! 🔥" },
  { mi: 1, amount: 125, message: "Halfway soon! 🎯" },
  { mi: 2, amount: 200, message: "We're crushing it!" },
  { mi: 3, amount: 100, message: "Keep going squad! 🌟" },
  { mi: 0, amount: 150, message: "75% here we come! 🚀" },
  { mi: 1, amount: 175, message: "Almost there! ⭐" },
  { mi: 2, amount: 125, message: "Final push! 💫" },
  { mi: 3, amount: 150, message: "So close! 🎊" },
  { mi: 0, amount: 200, message: "Last stretch! 🏆" },
  { mi: 1, amount: 100, message: "We did it! 🎉" },
];

function fireMilestoneBurst() {
  confetti({
    particleCount: 45,
    spread: 60,
    origin: { x: 0.5, y: 0.58 },
    colors: ['#7C3AED', '#14B8A6', '#8B5CF6', '#34D399', '#ffffff'],
    scalar: 0.75,
    startVelocity: 28,
    gravity: 0.9,
  });
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [squad, setSquad] = useState(null);
  const [member, setMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Demo Mode
  const [isDemoMode, setIsDemoMode] = useState(false);
  const isDemoModeRef = useRef(false);
  const demoIntervalRef = useRef(null);
  const demoStepRef = useRef(0);

  // Milestone badges
  const firedMilestonesRef = useRef(new Set());
  const [achievedMilestones, setAchievedMilestones] = useState([]);

  // ── Socket — created ONCE, lives for the full app session ────────────────────
  // Separate from squad changes so it never disconnects/reconnects mid-session.
  const socketRef = useRef(null);   // the live socket.io instance
  const squadIdRef = useRef(null);  // current squad ID for room management

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    // On every connect / reconnect: re-join whatever squad room is active
    s.on('connect', () => {
      console.log('[socket] connected:', s.id);
      if (squadIdRef.current) {
        console.log('[socket] (re-)joining room:', squadIdRef.current);
        s.emit('join-squad', squadIdRef.current);
      }
    });

    s.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', reason);
    });

    // contribution-added: prepend to feed + update squad total + re-sort leaderboard
    s.on('contribution-added', ({ contribution, squad: updatedSquad, member: contribMember }) => {
      console.log('[socket] contribution-added:', contribution?.id, '$' + contribution?.amount);
      setContributions(prev => [{ ...contribution, reactions: [] }, ...prev]);
      setSquad(updatedSquad);
      setMembers(prev => {
        if (!contribMember || !prev.find(m => m.id === contribMember.id)) return prev;
        return prev
          .map(m => m.id === contribMember.id
            ? { ...m, total_contributed: (parseFloat(m.total_contributed) || 0) + parseFloat(contribution.amount) }
            : m)
          .sort((a, b) => parseFloat(b.total_contributed) - parseFloat(a.total_contributed));
      });
    });

    // reaction-updated: swap the reactions array on the matching contribution
    s.on('reaction-updated', ({ contribution_id, reactions }) => {
      console.log('[socket] reaction-updated:', contribution_id);
      setContributions(prev =>
        prev.map(c => c.id === contribution_id ? { ...c, reactions } : c)
      );
    });

    // goal-achieved: stop demo, transition to celebration after short delay
    s.on('goal-achieved', ({ squad: achievedSquad }) => {
      console.log('[socket] goal-achieved');
      setSquad(achievedSquad);
      // Clear demo interval inline — safe because demoIntervalRef is a stable ref
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      setIsDemoMode(false);
      isDemoModeRef.current = false;
      setTimeout(() => setScreen('celebration'), 300);
    });

    socketRef.current = s;

    // Clean up only when the App component unmounts (never during squad changes)
    return () => {
      console.log('[socket] app unmounting — disconnecting socket');
      s.off();
      s.disconnect();
      socketRef.current = null;
    };
  }, []); // ← empty deps: runs exactly once

  // ── Squad room management — join/leave rooms as squad changes ────────────────
  useEffect(() => {
    const prevId = squadIdRef.current;
    const nextId = squad?.id ?? null;
    squadIdRef.current = nextId;

    if (nextId && nextId !== prevId) {
      // Joined a new squad: tell the server to add this socket to its room
      const s = socketRef.current;
      if (s?.connected) {
        console.log('[socket] emitting join-squad:', nextId);
        s.emit('join-squad', nextId);
      }
      // If socket isn't connected yet, the 'connect' handler above will join on connect
    }

    if (!nextId && prevId) {
      // Left a squad: emit leave-squad so the server removes us from the room
      const s = socketRef.current;
      if (s?.connected) {
        console.log('[socket] emitting leave-squad:', prevId);
        s.emit('leave-squad', prevId);
      }
    }
  }, [squad?.id]);

  // ── Milestone detection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!squad?.target_amount || !squad?.current_amount) return;
    const pct = (parseFloat(squad.current_amount) / parseFloat(squad.target_amount)) * 100;

    [25, 50, 75].forEach(t => {
      if (pct >= t && !firedMilestonesRef.current.has(t)) {
        firedMilestonesRef.current.add(t);
        setAchievedMilestones(prev => [...prev, t]);
        fireMilestoneBurst();
      }
    });

    if (pct >= 100 && !firedMilestonesRef.current.has(100)) {
      firedMilestonesRef.current.add(100);
      setAchievedMilestones(prev => [...prev, 100]);
    }
  }, [squad?.current_amount, squad?.target_amount]);

  // Keep isDemoMode ref in sync for the keyboard handler
  useEffect(() => { isDemoModeRef.current = isDemoMode; }, [isDemoMode]);

  // ── Ctrl+D: Demo Mode ─────────────────────────────────────────────────────────
  useEffect(() => {
    function handler(e) {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (isDemoModeRef.current) {
          stopDemo();
        } else {
          startDemo();
        }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session restore ───────────────────────────────────────────────────────────
  useEffect(() => {
    const savedSquadId = sessionStorage.getItem('squadId');
    const savedMemberId = sessionStorage.getItem('memberId');
    if (savedSquadId && savedMemberId) loadSquad(savedSquadId, savedMemberId);
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────────
  async function loadSquad(squadId, memberId) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/squads/${squadId}`);
      if (!res.ok) throw new Error('Squad not found');
      const { squad: loadedSquad, members: loadedMembers, contributions: loadedContribs } = await res.json();
      setSquad(loadedSquad);
      setMembers(loadedMembers);
      setContributions(loadedContribs);
      if (memberId) {
        const m = loadedMembers.find(mb => mb.id === memberId);
        if (m) setMember(m);
      }
      setScreen(loadedSquad.goal_achieved ? 'celebration' : 'dashboard');
    } catch (err) {
      setError(err.message);
      sessionStorage.removeItem('squadId');
      sessionStorage.removeItem('memberId');
    } finally {
      setLoading(false);
    }
  }

  // ── Demo Mode ─────────────────────────────────────────────────────────────────
  async function startDemo() {
    setLoading(true);
    setError('');
    firedMilestonesRef.current = new Set();
    setAchievedMilestones([]);

    try {
      const deadline = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      const squadRes = await fetch(`${API}/squads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bali Trip Fund',
          goal_description: "Sun, surf, and savings! Let's make this happen.",
          target_amount: 2000,
          deadline,
        }),
      });
      const { squad: demoSquad } = await squadRes.json();
      console.log('[demo] created squad:', demoSquad.id);

      const joinedMembers = [];
      for (const name of DEMO_MEMBERS) {
        const r = await fetch(`${API}/squads/${demoSquad.id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        const { member: m } = await r.json();
        joinedMembers.push(m);
      }
      console.log('[demo] joined', joinedMembers.length, 'members');

      demoStepRef.current = 0;
      const squadId = demoSquad.id;
      const memberIds = joinedMembers.map(m => m.id);

      // Set state — the squad room join happens in the squadId useEffect above
      setSquad(demoSquad);
      setMember(joinedMembers[0]);
      setMembers(joinedMembers.map(m => ({ ...m, total_contributed: 0 })));
      setContributions([]);
      setIsDemoMode(true);
      setScreen('dashboard');

      // Start contribution cadence — socket updates the UI via events
      const interval = setInterval(async () => {
        const step = demoStepRef.current;
        if (step >= DEMO_STEPS.length) {
          console.log('[demo] all steps done');
          clearInterval(demoIntervalRef.current);
          demoIntervalRef.current = null;
          return;
        }
        const { mi, amount, message } = DEMO_STEPS[step];
        demoStepRef.current = step + 1;

        console.log(`[demo] step ${step + 1}/${DEMO_STEPS.length} — ${DEMO_MEMBERS[mi]} $${amount}`);
        try {
          const res = await fetch(`${API}/squads/${squadId}/contribute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: memberIds[mi], amount, message }),
          });
          if (!res.ok) {
            const err = await res.json();
            console.error('[demo] contribution API error:', err);
          }
        } catch (fetchErr) {
          console.error('[demo] fetch failed:', fetchErr);
        }
      }, 3000);

      demoIntervalRef.current = interval;
      console.log('[demo] interval started');
    } catch (err) {
      console.error('[demo] setup error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function stopDemo() {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setIsDemoMode(false);
    isDemoModeRef.current = false;
  }

  // ── Regular squad actions ─────────────────────────────────────────────────────
  async function handleCreateSquad(formData) {
    setLoading(true);
    setError('');
    firedMilestonesRef.current = new Set();
    setAchievedMilestones([]);
    try {
      const res = await fetch(`${API}/squads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const joinRes = await fetch(`${API}/squads/${data.squad.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.creator_name }),
      });
      const joinData = await joinRes.json();

      setSquad(data.squad);
      setMember(joinData.member);
      setMembers([{ ...joinData.member, total_contributed: 0 }]);
      setContributions([]);
      sessionStorage.setItem('squadId', data.squad.id);
      sessionStorage.setItem('memberId', joinData.member.id);
      setScreen('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinSquad(inviteCode, memberName) {
    setLoading(true);
    setError('');
    firedMilestonesRef.current = new Set();
    setAchievedMilestones([]);
    try {
      const squadRes = await fetch(`${API}/squads/invite/${inviteCode}`);
      if (!squadRes.ok) throw new Error('Invalid invite code. Check and try again.');
      const { squad: foundSquad } = await squadRes.json();

      const joinRes = await fetch(`${API}/squads/${foundSquad.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: memberName }),
      });
      if (!joinRes.ok) throw new Error((await joinRes.json()).error);
      const { member: newMember } = await joinRes.json();

      await loadSquad(foundSquad.id, newMember.id);
      setMember(newMember);
      sessionStorage.setItem('squadId', foundSquad.id);
      sessionStorage.setItem('memberId', newMember.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleContribute(amount, message) {
    if (!squad || !member) return;
    const res = await fetch(`${API}/squads/${squad.id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: member.id, amount, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    // UI update comes via socket — no state change here
  }

  async function handleReact(contributionId, emoji) {
    try {
      await fetch(`${API}/contributions/${contributionId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      // UI update comes via socket
    } catch (err) {
      console.error('Reaction error:', err);
    }
  }

  function handleLeaveSquad() {
    stopDemo();
    sessionStorage.removeItem('squadId');
    sessionStorage.removeItem('memberId');
    setSquad(null); // triggers squadIdRef effect → emits leave-squad
    setMember(null);
    setMembers([]);
    setContributions([]);
    setScreen('home');
    setError('');
    firedMilestonesRef.current = new Set();
    setAchievedMilestones([]);
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading && screen === 'home') {
    return (
      <div className="min-h-dvh animated-bg flex items-center justify-center">
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading your squad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh animated-bg relative">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="relative z-10">
        {screen === 'home' && (
          <Home
            onCreateSquad={handleCreateSquad}
            onJoinSquad={handleJoinSquad}
            loading={loading}
            error={error}
            setError={setError}
          />
        )}
        {screen === 'dashboard' && squad && (
          <SquadDashboard
            squad={squad}
            member={member}
            members={members}
            contributions={contributions}
            onContribute={handleContribute}
            onReact={handleReact}
            onLeave={handleLeaveSquad}
            loading={loading}
            isDemoMode={isDemoMode}
            achievedMilestones={achievedMilestones}
          />
        )}
        {screen === 'celebration' && squad && (
          <CelebrationScreen
            squad={squad}
            members={members}
            member={member}
            onBack={() => setScreen('dashboard')}
          />
        )}
      </div>
    </div>
  );
}
