import { useState } from 'react';

export default function Home({ onCreateSquad, onJoinSquad, loading, error, setError }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [createForm, setCreateForm] = useState({
    name: '', goal_description: '', target_amount: '', deadline: '', creator_name: '',
  });
  const [joinForm, setJoinForm] = useState({ invite_code: '', member_name: '' });

  function handleCreateSubmit(e) {
    e.preventDefault();
    setError('');
    if (!createForm.creator_name.trim()) return setError('Please enter your name');
    if (!createForm.name.trim()) return setError('Please enter a squad name');
    if (!createForm.target_amount || parseFloat(createForm.target_amount) <= 0) return setError('Please enter a valid target amount');
    onCreateSquad(createForm);
  }

  function handleJoinSubmit(e) {
    e.preventDefault();
    setError('');
    if (!joinForm.invite_code.trim()) return setError('Please enter an invite code');
    if (!joinForm.member_name.trim()) return setError('Please enter your name');
    onJoinSquad(joinForm.invite_code.trim().toUpperCase(), joinForm.member_name.trim());
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Hero Header */}
      <div className="px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="text-violet-400 text-sm font-medium">Powered by Zolve</span>
        </div>

        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-teal-500 flex items-center justify-center shadow-2xl shadow-violet-900/50">
              <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="20" r="8" fill="rgba(255,255,255,0.9)" />
                <circle cx="32" cy="20" r="8" fill="rgba(255,255,255,0.7)" />
                <circle cx="24" cy="30" r="8" fill="rgba(255,255,255,0.8)" />
                <path d="M24 18L26.5 24H21.5L24 18Z" fill="#7C3AED" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-400 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Savings <span className="text-gradient">Squads</span>
        </h1>
        <p className="text-white/60 text-base max-w-xs mx-auto leading-relaxed">
          Save together with your crew. Gamified, social, and actually fun.
        </p>

        {/* Social proof pills */}
        <div className="flex justify-center gap-3 mt-5 flex-wrap">
          {[
            { icon: 'group', label: 'Group Goals' },
            { icon: 'chart', label: 'Live Progress' },
            { icon: 'trophy', label: 'Leaderboards' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <StatIcon type={icon} />
              <span className="text-white/70 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 px-4 pb-8 max-w-md mx-auto w-full">
        {/* Tabs */}
        <div className="glass-card p-1.5 flex gap-1 mb-4">
          {[
            { id: 'create', label: 'Create Squad' },
            { id: 'join', label: 'Join Squad' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === t.id ? 'tab-active' : 'tab-inactive'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="glass-card border-red-500/30 bg-red-500/10 p-3 mb-4 flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-red-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6v4m0 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Create Form */}
        {tab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="glass-card p-5 space-y-4">
            <div>
              <label className="label">Your Name *</label>
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                className="input-field"
                value={createForm.creator_name}
                onChange={e => setCreateForm(p => ({ ...p, creator_name: e.target.value }))}
                maxLength={40}
              />
            </div>

            <div>
              <label className="label">Squad Name *</label>
              <input
                type="text"
                placeholder="e.g. Bali Trip 2025"
                className="input-field"
                value={createForm.name}
                onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                maxLength={60}
              />
            </div>

            <div>
              <label className="label">Goal Description</label>
              <input
                type="text"
                placeholder="e.g. Save for our dream vacation!"
                className="input-field"
                value={createForm.goal_description}
                onChange={e => setCreateForm(p => ({ ...p, goal_description: e.target.value }))}
                maxLength={120}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Target Amount ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-base">$</span>
                  <input
                    type="number"
                    placeholder="5000"
                    className="input-field pl-7"
                    min="1"
                    step="0.01"
                    value={createForm.target_amount}
                    onChange={e => setCreateForm(p => ({ ...p, target_amount: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input
                  type="date"
                  className="input-field"
                  min={today}
                  value={createForm.deadline}
                  onChange={e => setCreateForm(p => ({ ...p, deadline: e.target.value }))}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 5v10m-5-5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Create Squad
                </>
              )}
            </button>
          </form>
        )}

        {/* Join Form */}
        {tab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="glass-card p-5 space-y-4">
            <div>
              <label className="label">Your Name *</label>
              <input
                type="text"
                placeholder="e.g. Sam Rivera"
                className="input-field"
                value={joinForm.member_name}
                onChange={e => setJoinForm(p => ({ ...p, member_name: e.target.value }))}
                maxLength={40}
              />
            </div>

            <div>
              <label className="label">Invite Code *</label>
              <input
                type="text"
                placeholder="e.g. AB12CD"
                className="input-field uppercase tracking-[0.2em] text-center text-xl font-bold"
                value={joinForm.invite_code}
                onChange={e => setJoinForm(p => ({ ...p, invite_code: e.target.value.toUpperCase().slice(0, 6) }))}
                maxLength={6}
              />
              <p className="text-white/40 text-xs mt-1.5 text-center">Ask a squad member for their 6-character code</p>
            </div>

            <button type="submit" disabled={loading} className="btn-teal w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 10l5-5 5 5M10 5v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Join Squad
                </>
              )}
            </button>
          </form>
        )}

        {/* How it works */}
        <div className="mt-6 glass-card p-5">
          <h3 className="text-white/80 text-sm font-semibold mb-4 text-center">How It Works</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Create a squad with your savings goal', color: 'bg-violet-500' },
              { step: '2', text: 'Share invite code with friends & family', color: 'bg-purple-500' },
              { step: '3', text: 'Log contributions & cheer each other on', color: 'bg-teal-500' },
              { step: '4', text: 'Celebrate when you hit 100%! 🎉', color: 'bg-emerald-500' },
            ].map(({ step, text, color }) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-7 h-7 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{step}</span>
                </div>
                <p className="text-white/60 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatIcon({ type }) {
  if (type === 'group') return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 text-violet-400" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 9.5c2.2 0 4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (type === 'chart') return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 text-teal-400" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12L6 7l3 4 4-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 text-amber-400" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2l1.8 3.6L14 6.3l-3 2.9.7 4.1L8 11.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
