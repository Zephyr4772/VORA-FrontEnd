import { useState } from 'react';
import { X, Scale, User, Mail, Lock, LogIn, UserPlus, Ghost } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Props {
  onAuthComplete: (userId: string, isGuest: boolean, displayName: string) => void;
}

type Mode = 'landing' | 'login' | 'signup';

export default function LoginModal({ onAuthComplete }: Props) {
  const [mode, setMode] = useState<Mode>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');

  const handleGuest = () => {
    const guestId = `guest_${Date.now()}`;
    onAuthComplete(guestId, true, 'Counselor');
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill all fields.'); return; }
    setLoading(true); setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      onAuthComplete(data.user.id, false, profile?.display_name || email.split('@')[0]);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !displayName) { setError('Please fill all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, is_guest: false } }
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.user) {
      setInfo('Check your email to confirm your account, then log in.');
      setMode('login');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0c10]">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-xl">
            L
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Lexis AI</h1>
          <p className="text-gray-500 text-sm mt-1">Indian Legal Intelligence System</p>
        </div>

        {/* Card */}
        <div className="bg-[#111318] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">

          {/* Landing */}
          {mode === 'landing' && (
            <div className="p-8 space-y-4">
              <h2 className="text-white font-semibold text-lg text-center mb-6">Welcome, Counselor</h2>

              <button
                onClick={() => setMode('login')}
                className="w-full flex items-center gap-3 p-4 bg-[#007bff] hover:bg-[#0056b3] text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => setMode('signup')}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium text-sm transition-all border border-white/10"
              >
                <UserPlus size={18} />
                <span>Create Account</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#111318] px-3 text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={handleGuest}
                className="w-full flex items-center gap-3 p-4 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-xl font-medium text-sm transition-all border border-white/5"
              >
                <Ghost size={18} />
                <div className="text-left">
                  <div>Continue as Guest</div>
                  <div className="text-[11px] text-gray-600 font-normal">No account needed · session only</div>
                </div>
              </button>
            </div>
          )}

          {/* Login */}
          {mode === 'login' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setMode('landing'); setError(''); }}
                  className="text-gray-500 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
                <h2 className="text-white font-semibold">Sign In</h2>
              </div>
              {info && <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs">{info}</div>}
              <div className="space-y-3">
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#1a1d24] border border-[#2d3139] rounded-xl pl-9 pr-4 py-3 text-sm text-gray-200 outline-none focus:border-[#007bff] transition-colors" />
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-[#1a1d24] border border-[#2d3139] rounded-xl pl-9 pr-4 py-3 text-sm text-gray-200 outline-none focus:border-[#007bff] transition-colors" />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button onClick={handleLogin} disabled={loading}
                  className="w-full py-3 bg-[#007bff] hover:bg-[#0056b3] disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => { setMode('signup'); setError(''); }}
                  className="text-xs text-gray-500 hover:text-white transition-colors">
                  Don't have an account? <span className="text-[#007bff]">Sign up</span>
                </button>
              </div>
              <div className="mt-3 text-center">
                <button onClick={handleGuest} className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1 mx-auto">
                  <Ghost size={12} /> Continue as guest instead
                </button>
              </div>
            </div>
          )}

          {/* Signup */}
          {mode === 'signup' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setMode('landing'); setError(''); }}
                  className="text-gray-500 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
                <h2 className="text-white font-semibold">Create Account</h2>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" placeholder="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-[#1a1d24] border border-[#2d3139] rounded-xl pl-9 pr-4 py-3 text-sm text-gray-200 outline-none focus:border-[#007bff] transition-colors" />
                </div>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#1a1d24] border border-[#2d3139] rounded-xl pl-9 pr-4 py-3 text-sm text-gray-200 outline-none focus:border-[#007bff] transition-colors" />
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSignup()}
                    className="w-full bg-[#1a1d24] border border-[#2d3139] rounded-xl pl-9 pr-4 py-3 text-sm text-gray-200 outline-none focus:border-[#007bff] transition-colors" />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button onClick={handleSignup} disabled={loading}
                  className="w-full py-3 bg-[#007bff] hover:bg-[#0056b3] disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => { setMode('login'); setError(''); }}
                  className="text-xs text-gray-500 hover:text-white transition-colors">
                  Already have an account? <span className="text-[#007bff]">Sign in</span>
                </button>
              </div>
              <div className="mt-3 text-center">
                <button onClick={handleGuest} className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1 mx-auto">
                  <Ghost size={12} /> Continue as guest instead
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          1.5M+ Supreme Court judgements · RAG-powered · Private
        </p>
      </div>
    </div>
  );
}
