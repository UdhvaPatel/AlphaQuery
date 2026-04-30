import { useState } from 'react';

const EMOJIS = ['🔥', '💪', '🎉', '❤️', '👏'];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

// Detect if a message is a "hype" message — has an emoji or is enthusiastic
function isHype(message) {
  if (!message) return false;
  return /[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{27FF}]|[!]{2,}/u.test(message) || message.length > 20;
}

export default function ContributionFeed({ contributions, members, onReact }) {
  const [reacting, setReacting] = useState(null);
  const [popping, setPopping] = useState({});

  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m; });

  async function handleReact(contributionId, emoji) {
    const key = `${contributionId}_${emoji}`;
    setPopping(p => ({ ...p, [key]: true }));
    setTimeout(() => setPopping(p => { const n = { ...p }; delete n[key]; return n; }), 350);
    setReacting(null);
    await onReact(contributionId, emoji);
  }

  if (!contributions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white/30" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-white/40 text-sm">No contributions yet.</p>
        <p className="text-white/30 text-xs mt-1">Log the first one above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contributions.map((c, i) => {
        const member = memberMap[c.member_id];
        const isNew = i === 0;
        const hasHype = isHype(c.message);

        return (
          <div key={c.id} className={`glass-card p-4 ${isNew ? 'animate-slide-in' : ''}`}>
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md mt-0.5"
                style={{ backgroundColor: member?.color || '#7C3AED' }}
              >
                {getInitials(c.member_name)}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white text-sm font-semibold truncate">{c.member_name}</span>
                    <span className="text-white/30 text-xs flex-shrink-0">{timeAgo(c.created_at)}</span>
                  </div>
                  <span className="text-teal-400 text-sm font-bold flex-shrink-0 tabular-nums">
                    +{formatCurrency(c.amount)}
                  </span>
                </div>

                {/* Hype message — styled as social post quote */}
                {c.message && (
                  hasHype ? (
                    <div className="relative mb-2.5 pl-3">
                      {/* Left accent bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                        style={{ background: `linear-gradient(180deg, ${member?.color || '#7C3AED'}, rgba(20,184,166,0.4))` }}
                      />
                      <p className="text-white/85 text-sm leading-relaxed font-medium">{c.message}</p>
                    </div>
                  ) : (
                    <p className="text-white/55 text-sm mb-2 leading-relaxed">{c.message}</p>
                  )
                )}

                {/* Reactions row */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {(c.reactions || []).filter(r => r.count > 0).map(r => (
                    <button
                      key={r.emoji}
                      onClick={() => handleReact(c.id, r.emoji)}
                      className={`flex items-center gap-1 bg-white/8 hover:bg-white/15 border border-white/15 hover:border-white/25 rounded-full px-2 py-0.5 transition-all duration-150 active:scale-90 ${popping[`${c.id}_${r.emoji}`] ? 'reaction-pop' : ''}`}
                    >
                      <span className="text-sm leading-none">{r.emoji}</span>
                      <span className="text-white/60 text-xs font-medium tabular-nums">{r.count}</span>
                    </button>
                  ))}

                  {/* Add reaction */}
                  <div className="relative">
                    <button
                      onClick={() => setReacting(reacting === c.id ? null : c.id)}
                      className="flex items-center justify-center w-7 h-6 bg-white/5 hover:bg-white/12 border border-white/10 hover:border-white/20 rounded-full transition-all duration-150 active:scale-90"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-white/40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M5.5 9.5s.5 1.5 2.5 1.5 2.5-1.5 2.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <circle cx="6" cy="7" r="0.7" fill="currentColor"/>
                        <circle cx="10" cy="7" r="0.7" fill="currentColor"/>
                      </svg>
                    </button>

                    {reacting === c.id && (
                      <div className="absolute bottom-8 left-0 z-50 glass-card border-white/20 p-2 flex gap-1.5 shadow-2xl animate-slide-in">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(c.id, emoji)}
                            className="text-lg hover:scale-125 transition-transform duration-150 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
