import { Search, Plus, Settings, HelpCircle, User, Home, MessageSquare, LogIn, Mail, Lock, X, Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  onOpenFilters: () => void;
  onOpenProfile: () => void;
  onHome?: () => void;
  onOpenHelp?: () => void;
  hasKey: boolean;
  displayName?: string;
  isGuest?: boolean;
  onNewChat?: () => void;
  chatHistory?: { id: string, title: string, created_at: string }[];
  onSelectChat?: (id: string) => void;
  currentChatId?: string;
  onSignIn?: (userId: string, displayName: string) => void;
}

const SidebarItem = ({ icon, label, isOpen, onClick }: { icon: React.ReactNode, label: string, isOpen: boolean, onClick?: () => void }) => (
  <button onClick={onClick} className={`h-[48px] w-full flex items-center ${isOpen ? 'px-3 rounded-2xl' : 'justify-center rounded-full'} text-gray-500 hover:bg-[#FDF0E7] hover:text-[#D16F54] transition-colors relative group`}>
    <div className="w-[48px] h-[48px] shrink-0 flex items-center justify-center">
      {icon}
    </div>
    <span className={`font-medium text-[14px] whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
      {label}
    </span>
    {!isOpen && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </button>
);

export default function LeftSidebar({ 
  isOpen, onToggle, onOpenSettings, onOpenProfile, onHome, onOpenHelp, 
  hasKey, displayName = 'Counselor', isGuest = false, onNewChat, chatHistory = [], onSelectChat, currentChatId, onSignIn 
}: Props) {
  const [search, setSearch] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const resetModal = () => {
    setEmail(''); setPassword(''); setName(''); setError(''); setInfo('');
  };

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please fill all fields.'); return; }
    setLoading(true); setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.user && onSignIn) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      onSignIn(data.user.id, profile?.display_name || email.split('@')[0]);
      setShowSignInModal(false);
      resetModal();
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) { setError('Please fill all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name, is_guest: false } }
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.user) {
      setInfo('Check your email to confirm your account, then sign in.');
      setAuthMode('signin');
      setPassword('');
    }
  };

  return (
    <>
      <div 
        className="h-full flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative flex-shrink-0 bg-white rounded-[36px] shadow-sm py-4"
        style={{ width: isOpen ? '260px' : '72px' }}
      >
        <div className="w-full h-full flex flex-col overflow-hidden items-center">
          
          {/* Logo Toggle */}
          <div className={`mt-2 flex items-center ${isOpen ? 'w-full px-5' : 'justify-center'} shrink-0 cursor-pointer h-12`} onClick={onToggle}>
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D16F54" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <span className={`ml-3 font-serif text-[22px] text-[#333] tracking-tight transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              Vora Legal
            </span>
          </div>

          {/* New Chat Button */}
          <div className={`mt-4 shrink-0 flex ${isOpen ? 'w-full px-4' : 'justify-center'}`}>
            <button onClick={onNewChat} className={`h-[48px] ${isOpen ? 'w-full rounded-2xl' : 'w-[48px] rounded-[18px]'} flex items-center bg-[#D16F54] hover:bg-[#B85D44] text-white transition-colors overflow-hidden relative group shadow-sm justify-center`}>
              <div className="w-[48px] h-[48px] shrink-0 flex items-center justify-center">
                <Plus size={22} strokeWidth={2} />
              </div>
              <span className={`font-medium text-[14px] whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100 mr-4' : 'opacity-0 w-0 hidden'}`}>
                New Chat
              </span>
              {!isOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  New Chat
                </div>
              )}
            </button>
          </div>

          {/* Navigation Icons */}
          <div className={`flex flex-col gap-2 mt-8 ${isOpen ? 'w-full px-3' : 'w-[48px]'}`}>
            <SidebarItem icon={<Home size={22} strokeWidth={1.5} />} label="Home" isOpen={isOpen} onClick={onHome} />
          </div>

          {/* Search & History (Only when open) */}
          {isOpen && (
            <div className="flex-1 flex flex-col w-full mt-4 overflow-hidden animate-fade-in px-4">
               <div className="relative shrink-0 mb-4">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="w-full bg-[#F3F4F6] rounded-xl py-2 pl-10 pr-4 text-[13px] text-gray-800 outline-none focus:bg-[#E5E7EB] transition-colors"
                 />
               </div>
               
               <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
                 {chatHistory.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8 opacity-60">
                     <span className="text-gray-500 text-[12px] uppercase tracking-widest font-medium">No history</span>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-1">
                     {chatHistory.filter(c => c.title.toLowerCase().includes(search.toLowerCase())).map(chat => (
                       <button
                         key={chat.id}
                         onClick={() => onSelectChat && onSelectChat(chat.id)}
                         className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] transition-colors flex items-center gap-3 ${currentChatId === chat.id ? 'bg-[#FDF0E7] text-[#D16F54] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                       >
                         <MessageSquare size={14} className={`shrink-0 ${currentChatId === chat.id ? 'text-[#D16F54]' : 'text-gray-400'}`} />
                         <span className="truncate flex-1">{chat.title}</span>
                       </button>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* Spacer if closed */}
          {!isOpen && <div className="flex-1" />}

          {/* Bottom actions */}
          <div className={`mt-auto pb-2 flex flex-col gap-2 shrink-0 ${isOpen ? 'w-full px-3' : 'w-[48px]'}`}>
            <SidebarItem icon={<HelpCircle size={22} strokeWidth={1.5} />} label="Help" isOpen={isOpen} onClick={onOpenHelp} />
            <SidebarItem icon={<Settings size={22} strokeWidth={1.5} />} label="Settings" isOpen={isOpen} onClick={onOpenSettings} />
            
            {/* Guest: Show Sign In button | Authenticated: Show profile */}
            {isGuest ? (
              <button 
                onClick={() => setShowSignInModal(true)} 
                className={`h-[48px] w-full flex items-center ${isOpen ? 'px-3 rounded-2xl' : 'justify-center rounded-full'} text-[#D16F54] hover:bg-[#FDF0E7] transition-colors relative group`}
              >
                <div className="w-[48px] h-[48px] shrink-0 flex items-center justify-center">
                  <LogIn size={20} strokeWidth={1.5} />
                </div>
                <span className={`font-medium text-[14px] whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                  Sign In
                </span>
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    Sign In
                  </div>
                )}
              </button>
            ) : (
              <button onClick={onOpenProfile} className={`h-[48px] w-full flex items-center ${isOpen ? 'px-3 rounded-2xl' : 'justify-center rounded-full'} hover:bg-[#FDF0E7] transition-colors relative group`}>
                <div className="w-[48px] h-[48px] shrink-0 flex items-center justify-center">
                  <div className="w-[28px] h-[28px] rounded-full bg-[#FDF0E7] flex items-center justify-center overflow-hidden border border-orange-900/10">
                     <User size={16} className="text-[#D16F54]" />
                  </div>
                </div>
                <span className={`flex flex-col items-start transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                  <span className="text-[13px] font-medium text-gray-700 leading-tight">{displayName}</span>
                  <span className="text-[11px] text-gray-500 leading-tight">Pro</span>
                </span>
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {displayName}
                  </div>
                )}
              </button>
            )}

            {/* Footer Text Links (Only when open) */}
            <div className={`mt-2 flex justify-center items-center gap-3 transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <button onClick={() => document.getElementById('privacy-trigger')?.click()} className="text-[10px] text-gray-400 hover:text-[#D16F54] transition-colors font-medium">Privacy Policy</button>
              <span className="text-[10px] text-gray-300">•</span>
              <span className="text-[10px] text-gray-400">Vora Legal © 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Auth Modal (Sign In + Create Account, themed to match the app) ── */}
      {showSignInModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => { setShowSignInModal(false); resetModal(); }} />
          <div className="relative w-full max-w-[380px] mx-4 bg-white rounded-[28px] shadow-2xl border border-orange-900/5 overflow-hidden animate-fade-in z-10">
            
            {/* Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D16F54" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[17px] font-serif font-medium text-[#333] tracking-tight">
                      {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {authMode === 'signin' ? 'Access your saved research' : 'Start your legal workspace'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowSignInModal(false); resetModal(); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 p-1 bg-[#F3F4F6] rounded-xl mb-5">
                <button
                  onClick={() => { setAuthMode('signin'); setError(''); setInfo(''); }}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${authMode === 'signin' ? 'bg-white text-[#333] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setError(''); setInfo(''); }}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${authMode === 'signup' ? 'bg-white text-[#333] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Create Account
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs">
                  {error}
                </div>
              )}
              {info && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-500 text-xs">
                  {info}
                </div>
              )}

              <div className="space-y-3">
                {/* Name field (only for signup) */}
                {authMode === 'signup' && (
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-[#F3F4F6] border border-transparent rounded-xl pl-11 pr-4 py-3 text-sm text-gray-800 outline-none focus:border-[#D16F54]/30 focus:bg-white transition-all placeholder-gray-400"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    autoComplete="email"
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#F3F4F6] border border-transparent rounded-xl pl-11 pr-4 py-3 text-sm text-gray-800 outline-none focus:border-[#D16F54]/30 focus:bg-white transition-all placeholder-gray-400"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    placeholder={authMode === 'signup' ? 'Password (min 6 characters)' : 'Password'}
                    value={password}
                    autoComplete="new-password"
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (authMode === 'signin' ? handleSignIn() : handleSignUp())}
                    className="w-full bg-[#F3F4F6] border border-transparent rounded-xl pl-11 pr-4 py-3 text-sm text-gray-800 outline-none focus:border-[#D16F54]/30 focus:bg-white transition-all placeholder-gray-400"
                  />
                </div>

                <button
                  onClick={authMode === 'signin' ? handleSignIn : handleSignUp}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#D16F54] hover:bg-[#B85D44] disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-sm mt-1"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : authMode === 'signin' ? (
                    <><LogIn size={16} /> Sign In</>
                  ) : (
                    <><UserPlus size={16} /> Create Account</>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-[#FAFAFA] border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-400">
                {authMode === 'signin'
                  ? 'Your guest session will be preserved after signing in.'
                  : 'After creating your account, check your email to confirm.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
