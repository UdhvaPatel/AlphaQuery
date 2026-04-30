import { useState, useMemo } from 'react';
import Leaderboard from './Leaderboard';
import ContributionFeed from './ContributionFeed';

const MILESTONES = [
  { pct: 25, icon: '🌱', label: '25%', color: '#10B981' },
  { pct: 50, icon: '🌿', label: '50%', color: '#14B8A6' },
  { pct: 75, icon: '🌳', label: '75%', color: '#0D9488' },
  { pct: 100, icon: '🏆', label: '100%', color: '#F59E0B' },
];

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);
}

function getDaysRemaining(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ contributions }) {
  const W = 280, H = 36, PAD = 4;

  const { dayTotals, dayLabels, hasData } = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    const totals = days.map(day =>
      contributions
        .filter(c => {
          const dt = new Date(c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z');
          return dt.toISOString().split('T')[0] === day;
        })
        .reduce((s, c) => s + parseFloat(c.amount || 0), 0)
    );
    const labels = days.map(d => {
      const day = new Date(d + 'T12:00:00');
      return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][day.getDay()];
    });
    return { dayTotals: totals, dayLabels: labels, hasData: totals.some(t => t > 0) };
  }, [contributions]);

  const maxVal = Math.max(...dayTotals, 1);
  const points = dayTotals.map((v, i) => ({
    x: (i / 6) * W,
    y: PAD + (H - PAD * 2) - (v / maxVal) * (H - PAD * 2),
  }));

  // Smooth bezier path
  function buildPath(pts) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      d += ` C ${mx.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${pts[i + 1].y.toFixed(1)} ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
    }
    return d;
  }

  const linePath = buildPath(points);
  const fillPath = hasData
    ? `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`
    : '';

  const todayTotal = dayTotals[6];

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-white/40 text-xs">7-day momentum</span>
        <span className={`text-xs font-medium ${todayTotal > 0 ? 'text-teal-400' : 'text-white/30'}`}>
          {todayTotal > 0 ? `+${formatCurrency(todayTotal)} today` : 'No activity today'}
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '36px' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="sparkLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
            <linearGradient id="sparkFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {!hasData && (
            <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="4 4" />
          )}

          {hasData && (
            <>
              <path d={fillPath} fill="url(#sparkFill)" />
              <path d={linePath} fill="none" stroke="url(#sparkLine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              {/* Today's dot */}
              {todayTotal > 0 && (
                <circle
                  cx={points[6].x}
                  cy={points[6].y}
                  r="3"
                  fill="#14B8A6"
                  style={{ filter: 'drop-shadow(0 0 4px #14B8A6)' }}
                />
              )}
            </>
          )}
        </svg>

        {/* Day labels */}
        <div className="flex justify-between mt-1">
          {dayLabels.map((label, i) => (
            <span
              key={i}
              className={`text-[10px] w-4 text-center ${i === 6 ? 'text-teal-400 font-semibold' : 'text-white/25'}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Milestone badges ──────────────────────────────────────────────────────────

function MilestoneBadges({ progress, achievedMilestones }) {
  return (
    <div className="relative h-8 mt-1 mb-1">
      {MILESTONES.map(({ pct, icon, label, color }) => {
        const achieved = achievedMilestones.includes(pct) || progress >= pct;
        const pos = Math.min(pct, 98); // keep 100% badge slightly inset

        return (
          <div
            key={pct}
            className="absolute flex flex-col items-center"
            style={{ left: `${pos}%`, transform: 'translateX(-50%)', top: 0 }}
          >
            <div
              className={`text-base leading-none transition-all duration-500 ${achieved ? 'opacity-100 scale-100' : 'opacity-25 scale-90 grayscale'}`}
              style={achieved ? { filter: `drop-shadow(0 0 6px ${color})` } : {}}
              title={`${label} milestone${achieved ? ' — unlocked!' : ''}`}
            >
              {icon}
            </div>
            <div
              className={`text-[9px] font-semibold mt-0.5 transition-all duration-500 ${achieved ? '' : 'opacity-30'}`}
              style={{ color: achieved ? color : 'rgba(255,255,255,0.4)' }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Demo Mode Banner ──────────────────────────────────────────────────────────

function DemoBanner({ onStop }) {
  return (
    <div className="mx-4 mb-3 glass-card border-amber-500/30 bg-amber-500/8 px-4 py-2.5 flex items-center gap-3">
      <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" style={{ animation: 'urgencyPulse 1s ease-in-out infinite' }} />
      <div className="flex-1 min-w-0">
        <span className="text-amber-300 text-xs font-semibold">Demo Mode</span>
        <span className="text-amber-400/70 text-xs ml-2">Contributions auto-rolling every 3s…</span>
      </div>
      <button
        onClick={onStop}
        className="text-amber-400/60 hover:text-amber-300 text-xs border border-amber-500/20 hover:border-amber-500/40 rounded-lg px-2 py-1 transition-all flex-shrink-0"
      >
        Stop
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SquadDashboard({
  squad, member, members, contributions,
  onContribute, onReact, onLeave, loading,
  isDemoMode, achievedMilestones,
}) {
  const [tab, setTab] = useState('feed');
  const [contribAmount, setContribAmount] = useState('');
  const [contribMessage, setContribMessage] = useState('');
  const [contributing, setContributing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');
  const [showContribForm, setShowContribForm] = useState(false);

  const progress = useMemo(() => {
    if (!squad?.target_amount) return 0;
    return Math.min(100, (parseFloat(squad.current_amount || 0) / parseFloat(squad.target_amount)) * 100);
  }, [squad]);

  const daysLeft = useMemo(() => getDaysRemaining(squad?.deadline), [squad?.deadline]);

  async function handleContribute(e) {
    e.preventDefault();
    setFormError('');
    const amt = parseFloat(contribAmount);
    if (!amt || amt <= 0) return setFormError('Enter a valid amount');
    if (!member) return setFormError('You must join the squad first');
    setContributing(true);
    try {
      await onContribute(amt, contribMessage.trim() || null);
      setContribAmount('');
      setContribMessage('');
      setShowContribForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setContributing(false);
    }
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(squad.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyInviteLink() {
    const url = `${window.location.origin}?invite=${squad.invite_code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  return (
    <div className="min-h-dvh flex flex-col max-w-md mx-auto">
      {/* Demo mode banner */}
      {isDemoMode && <DemoBanner onStop={onLeave} />}

      {/* Header */}
      <div className="px-4 pt-8 pb-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={onLeave} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 18l-8-8 8-8M2 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm">Home</span>
          </button>

          {squad.goal_achieved ? (
            <div className="flex items-center gap-1.5 bg-teal-500/15 border border-teal-500/30 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-teal-400 rounded-full" style={{ animation: 'urgencyPulse 1.5s ease-in-out infinite' }} />
              <span className="text-teal-300 text-xs font-semibold">Goal Achieved!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-violet-400 rounded-full" style={{ animation: 'urgencyPulse 2s ease-in-out infinite' }} />
              <span className="text-violet-300 text-xs font-medium">Live</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {squad.name}
        </h1>
        {squad.goal_description && (
          <p className="text-white/50 text-sm mb-4 leading-relaxed">{squad.goal_description}</p>
        )}

        {/* Progress card */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-white/50 text-xs mb-1">Raised</div>
              <div className="text-2xl font-black text-white count-up" key={squad.current_amount}>
                {formatCurrency(squad.current_amount)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/50 text-xs mb-1">Goal</div>
              <div className="text-lg font-bold text-white/70">{formatCurrency(squad.target_amount)}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar-track mb-1">
            <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
          </div>

          {/* Milestone badges row */}
          <MilestoneBadges progress={progress} achievedMilestones={achievedMilestones} />

          <div className="flex items-center justify-between mt-1">
            <span className={`text-sm font-semibold ${progress >= 100 ? 'text-teal-400' : 'text-gradient'}`}>
              {progress.toFixed(1)}% funded
            </span>
            <div className={`flex items-center gap-1 text-xs ${isUrgent ? 'text-red-400 urgency-pulse' : isOverdue ? 'text-red-500' : 'text-white/40'}`}>
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {daysLeft === null ? 'No deadline' :
               isOverdue ? 'Overdue' :
               daysLeft === 0 ? 'Last day!' :
               `${daysLeft}d left`}
            </div>
          </div>

          {/* Sparkline */}
          <Sparkline contributions={contributions} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatCard value={members.length} label="Members" icon={<PeopleIcon />} />
          <StatCard value={contributions.length} label="Contributions" icon={<MoneyIcon />} />
          <StatCard
            value={formatCurrency(Math.max(0, squad.target_amount - squad.current_amount))}
            label="Remaining"
            icon={<TargetIcon />}
          />
        </div>

        {/* Invite code card */}
        <div className="glass-card p-4 mb-4 border-teal-500/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 text-xs font-medium">Invite Code</span>
            <button
              onClick={copyInviteLink}
              className="text-teal-400 text-xs hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 11H5a4 4 0 010-8h2M9 5h2a4 4 0 010 8H9M5.5 8h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Share link
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center">
              <span className="text-white text-2xl font-black tracking-[0.25em]">{squad.invite_code}</span>
            </div>
            <button
              onClick={copyInviteCode}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                copied
                  ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/15 active:scale-95'
              }`}
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copied
                </span>
              ) : 'Copy'}
            </button>
          </div>
        </div>

        {/* Contribute button / form */}
        {member && (
          <div className="mb-2">
            {!showContribForm ? (
              <button
                onClick={() => setShowContribForm(true)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4"
              >
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Log Contribution
              </button>
            ) : (
              <form onSubmit={handleContribute} className="glass-card p-4 border-violet-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">Add Contribution</h3>
                  <button type="button" onClick={() => { setShowContribForm(false); setFormError(''); }} className="text-white/40 hover:text-white/70">
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {formError && (
                  <div className="text-red-300 text-xs mb-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: member.color || '#7C3AED' }}
                  >
                    {getInitials(member.name)}
                  </div>
                  <span className="text-white/70 text-sm">{member.name}</span>
                </div>

                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-lg font-bold">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="input-field pl-8 text-xl font-bold"
                    value={contribAmount}
                    onChange={e => setContribAmount(e.target.value)}
                    autoFocus
                  />
                </div>

                <input
                  type="text"
                  placeholder="Hype message (optional) — share your motivation!"
                  className="input-field mb-3 text-sm"
                  value={contribMessage}
                  onChange={e => setContribMessage(e.target.value)}
                  maxLength={120}
                />

                <div className="flex gap-2 mb-3 flex-wrap">
                  {[25, 50, 100, 250].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setContribAmount(String(amt))}
                      className="bg-white/8 border border-white/15 hover:bg-white/15 rounded-lg px-3 py-1.5 text-white/70 text-xs font-medium transition-all active:scale-95"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <button type="submit" disabled={contributing} className="btn-primary w-full flex items-center justify-center gap-2">
                  {contributing
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Confirm Contribution'
                  }
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 pb-2">
        <div className="glass-card p-1 flex gap-1">
          {[{ id: 'feed', label: 'Feed' }, { id: 'leaderboard', label: 'Leaderboard' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === t.id ? 'tab-active' : 'tab-inactive'}`}
            >
              {t.id === 'leaderboard' && '🏆 '}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 pb-8 pt-3">
        {tab === 'feed' && (
          <ContributionFeed contributions={contributions} members={members} onReact={onReact} />
        )}
        {tab === 'leaderboard' && (
          <Leaderboard members={members} currentMemberId={member?.id} squadCreatedAt={squad.created_at} />
        )}
      </div>

      {/* Demo hint — shown at bottom when not in demo */}
      {!isDemoMode && (
        <div className="text-center pb-4">
          <span className="text-white/15 text-xs">Press Ctrl+D for demo mode</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, icon }) {
  return (
    <div className="glass-card p-3 text-center">
      <div className="flex justify-center mb-1 text-white/40">{icon}</div>
      <div className="text-white font-bold text-sm truncate">{value}</div>
      <div className="text-white/40 text-xs">{label}</div>
    </div>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 13c0-2 2-3.5 4.5-3.5S10 11 10 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M10.5 9.5C12.5 9.5 15 11 15 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 4.5v7M6 6.5c0-.8.9-1.5 2-1.5s2 .7 2 1.5-1 1.3-2 1.5c-1 .2-2 .7-2 1.5S6.9 11 8 11s2-.7 2-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="8" cy="8" r="1" fill="currentColor"/>
    </svg>
  );
}
