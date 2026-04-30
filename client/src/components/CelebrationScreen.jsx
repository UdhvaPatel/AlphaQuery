import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default function CelebrationScreen({ squad, members, member, onBack }) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const duration = 5000;
    const end = Date.now() + duration;

    const colors = ['#7C3AED', '#14B8A6', '#8B5CF6', '#34D399', '#A78BFA', '#6EE7B7', '#ffffff'];

    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }
    frame();

    // Burst in the middle
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });
    }, 300);

    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 120,
        origin: { y: 0.5 },
        colors,
        scalar: 1.2,
      });
    }, 1200);

    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.4 },
        colors,
        shapes: ['star'],
      });
    }, 2500);
  }, []);

  const topContributor = [...members].sort((a, b) => b.total_contributed - a.total_contributed)[0];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-12 text-center relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(20,184,166,0.15) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      {/* Trophy icon */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-2xl shadow-amber-900/50 mx-auto"
          style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}>
          <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6h24v18a12 12 0 01-24 0V6z" fill="white" fillOpacity="0.95" />
            <path d="M12 10H6a4 4 0 004 4h2M36 10h6a4 4 0 01-4 4h-2" stroke="white" strokeOpacity="0.6" strokeWidth="2" />
            <rect x="18" y="30" width="12" height="4" rx="2" fill="white" fillOpacity="0.8" />
            <rect x="14" y="38" width="20" height="4" rx="2" fill="white" fillOpacity="0.9" />
            <path d="M24 12l2 5 5 .5-3.8 3.5 1.2 5-4.4-2.8-4.4 2.8 1.2-5L17 17.5l5-.5z" fill="#FDE68A" />
          </svg>
        </div>
        {/* Sparkle dots */}
        {[
          { top: '-8px', right: '-4px', size: 'w-4 h-4', color: 'bg-teal-400' },
          { top: '8px', left: '-8px', size: 'w-3 h-3', color: 'bg-violet-400' },
          { bottom: '4px', right: '-8px', size: 'w-3 h-3', color: 'bg-amber-400' },
        ].map((s, i) => (
          <div key={i} className={`absolute ${s.size} ${s.color} rounded-full`} style={{ top: s.top, right: s.right, left: s.left, bottom: s.bottom, animation: `urgencyPulse ${1 + i * 0.3}s ease-in-out infinite` }} />
        ))}
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-teal-500/15 border border-teal-500/30 rounded-full px-4 py-1.5 mb-4">
        <div className="w-2 h-2 bg-teal-400 rounded-full" style={{ animation: 'urgencyPulse 1.5s ease-in-out infinite' }} />
        <span className="text-teal-300 text-sm font-semibold">Goal Achieved!</span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        You Did It,{' '}
        <span className="text-gradient">{squad.name}!</span>
      </h1>

      <p className="text-white/60 text-base max-w-sm mx-auto mb-2 leading-relaxed">
        {squad.goal_description || 'Your squad crushed the savings goal together!'}
      </p>

      {/* Amount badge */}
      <div className="glass-card border-teal-500/20 bg-teal-500/8 px-8 py-4 mb-8 inline-block">
        <div className="text-4xl font-black text-gradient mb-1">
          {formatCurrency(squad.target_amount)}
        </div>
        <div className="text-white/50 text-sm">100% funded</div>
      </div>

      {/* Top contributor callout */}
      {topContributor && (
        <div className="glass-card border-amber-500/20 bg-amber-500/8 p-4 mb-6 flex items-center gap-3 max-w-xs w-full mx-auto">
          <div className="text-2xl">👑</div>
          <div className="text-left">
            <div className="text-white/50 text-xs mb-0.5">Top Contributor</div>
            <div className="text-white font-semibold text-sm">{topContributor.name}</div>
            <div className="text-amber-400 text-xs">{formatCurrency(topContributor.total_contributed)}</div>
          </div>
        </div>
      )}

      {/* Member avatars */}
      <div className="flex justify-center mb-8 -space-x-3">
        {members.slice(0, 8).map((m, i) => (
          <div
            key={m.id}
            className="w-11 h-11 rounded-full border-2 border-[#0A0612] flex items-center justify-center text-white text-xs font-bold shadow-lg"
            style={{ backgroundColor: m.color || '#7C3AED', zIndex: 10 - i }}
          >
            {getInitials(m.name)}
          </div>
        ))}
        {members.length > 8 && (
          <div className="w-11 h-11 rounded-full border-2 border-[#0A0612] bg-white/10 flex items-center justify-center text-white/60 text-xs font-bold" style={{ zIndex: 0 }}>
            +{members.length - 8}
          </div>
        )}
      </div>

      {/* Squad stats */}
      <div className="grid grid-cols-3 gap-3 max-w-sm w-full mb-8">
        {[
          { label: 'Members', value: members.length, icon: '👥' },
          { label: 'Goal', value: formatCurrency(squad.target_amount), icon: '🎯' },
          { label: 'Days', value: squad.deadline ? Math.max(0, Math.ceil((new Date(squad.deadline) - new Date()) / 86400000)) : '—', icon: '📅' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="glass-card p-3 text-center">
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-white font-bold text-sm">{value}</div>
            <div className="text-white/40 text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Personalized message */}
      {member && (
        <div className="glass-card border-violet-500/20 bg-violet-500/8 p-4 mb-8 max-w-sm w-full">
          <p className="text-white/80 text-sm leading-relaxed">
            <span className="text-violet-300 font-semibold">{member.name}</span>, you're a savings champion!
            Together you proved that saving is better with friends. 🚀
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 max-w-sm w-full">
        <button
          onClick={() => {
            confetti({
              particleCount: 100,
              spread: 100,
              origin: { y: 0.6 },
              colors: ['#7C3AED', '#14B8A6', '#8B5CF6', '#34D399', '#ffffff'],
            });
          }}
          className="btn-primary flex items-center justify-center gap-2 py-4 text-base"
        >
          <span>🎊</span> Celebrate Again!
        </button>

        <button onClick={onBack} className="btn-secondary flex items-center justify-center gap-2">
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 18l-8-8 8-8M2 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <p className="text-white/20 text-xs mt-8">Made by AlphaQuery for the INFORMSxZolve Hackathon</p>
    </div>
  );
}
