import { useMemo, useState } from 'react';

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatAmount(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${parseFloat(n).toFixed(0)}`;
}

function isSlacking(member, squadCreatedAt) {
  if (parseFloat(member.total_contributed || 0) > 0) return false;
  const ref = member.joined_at || squadCreatedAt;
  if (!ref) return false;
  const joinedMs = Date.now() - new Date(ref.endsWith('Z') ? ref : ref + 'Z').getTime();
  return joinedMs > 3 * 24 * 60 * 60 * 1000; // 3 days in ms
}

export default function Leaderboard({ members, currentMemberId, squadCreatedAt }) {
  const [nudged, setNudged] = useState({}); // { memberId: true }
  const [nudgeToast, setNudgeToast] = useState('');

  const total = useMemo(
    () => members.reduce((sum, m) => sum + parseFloat(m.total_contributed || 0), 0),
    [members]
  );

  function handleNudge(member) {
    setNudged(prev => ({ ...prev, [member.id]: true }));
    setNudgeToast(`Nudge sent to ${member.name}! 🤗`);
    setTimeout(() => setNudgeToast(''), 2500);
  }

  if (!members.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white/30" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-white/40 text-sm">No members yet.</p>
        <p className="text-white/30 text-xs mt-1">Share the invite code!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      {/* Nudge toast */}
      {nudgeToast && (
        <div className="glass-card border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-center mb-2 animate-slide-in">
          <span className="text-violet-200 text-sm">{nudgeToast}</span>
        </div>
      )}

      {members.map((m, index) => {
        const contributed = parseFloat(m.total_contributed || 0);
        const pct = total > 0 ? ((contributed / total) * 100).toFixed(1) : '0.0';
        const isTop = index === 0 && contributed > 0;
        const isMe = m.id === currentMemberId;
        const slacking = isSlacking(m, squadCreatedAt);
        const alreadyNudged = nudged[m.id];

        return (
          <div
            key={m.id}
            className={`glass-card p-4 flex items-center gap-3 transition-all duration-300
              ${isTop ? 'glow-pulse border-violet-500/30 bg-violet-500/8' : ''}
              ${isMe ? 'border-teal-500/30' : ''}
              ${slacking && !isMe ? 'border-slate-500/20 opacity-80' : ''}
            `}
          >
            {/* Rank / Crown */}
            <div className="flex-shrink-0 w-7 text-center">
              {isTop ? (
                <CrownIcon />
              ) : (
                <span className={`text-sm font-bold ${index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-white/30'}`}>
                  {index + 1}
                </span>
              )}
            </div>

            {/* Avatar with slacking badge */}
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                style={{ backgroundColor: m.color || '#7C3AED', opacity: slacking ? 0.7 : 1 }}
              >
                {getInitials(m.name)}
              </div>
              {slacking && (
                <div
                  className="absolute -bottom-1 -right-1 text-sm leading-none"
                  title="No contributions yet — 3+ days after joining"
                >
                  😴
                </div>
              )}
            </div>

            {/* Name + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-white text-sm font-semibold truncate">{m.name}</span>
                {isMe && (
                  <span className="text-teal-400 text-xs bg-teal-500/15 border border-teal-500/20 rounded-full px-2 py-0.5 flex-shrink-0">
                    You
                  </span>
                )}
                {slacking && !isMe && (
                  <span className="text-slate-400 text-xs flex-shrink-0">hasn't contributed</span>
                )}
              </div>
              {contributed > 0 ? (
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: isTop
                        ? 'linear-gradient(90deg, #7C3AED, #14B8A6)'
                        : 'linear-gradient(90deg, #6D28D9, #0D9488)',
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-1.5 bg-white/5 rounded-full" />
              )}
            </div>

            {/* Amount + pct OR nudge button */}
            {slacking && !isMe ? (
              <button
                onClick={() => handleNudge(m)}
                disabled={alreadyNudged}
                className={`flex-shrink-0 text-xs rounded-xl px-3 py-1.5 border transition-all duration-200 active:scale-95
                  ${alreadyNudged
                    ? 'bg-violet-500/10 border-violet-500/20 text-violet-400/60 cursor-default'
                    : 'bg-violet-500/15 border-violet-500/30 text-violet-300 hover:bg-violet-500/25'
                  }`}
              >
                {alreadyNudged ? 'Nudged ✓' : 'Nudge 👋'}
              </button>
            ) : (
              <div className="flex-shrink-0 text-right">
                <div className={`text-sm font-bold ${isTop ? 'text-gradient' : 'text-white'}`}>
                  {formatAmount(contributed)}
                </div>
                <div className="text-white/40 text-xs">{pct}%</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Slacking legend */}
      {members.some(m => isSlacking(m, squadCreatedAt)) && (
        <div className="flex items-center gap-2 pt-1 pb-2 px-1">
          <span className="text-sm">😴</span>
          <span className="text-white/30 text-xs">Joined 3+ days ago with no contributions — tap Nudge to motivate them</span>
        </div>
      )}
    </div>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mx-auto" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 17l3-9 4 5 3-8 3 8 4-5 3 9H2z" fill="url(#crownGrad)" stroke="url(#crownGrad)" strokeWidth="0.5" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B"/>
          <stop offset="100%" stopColor="#FDE68A"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
