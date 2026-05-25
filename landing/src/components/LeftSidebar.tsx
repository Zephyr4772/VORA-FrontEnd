import { Search, Plus, Settings, HelpCircle, User, Compass, Clock, Home, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { ProfileCard } from './ui/profile-card';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  onOpenFilters: () => void;
  onOpenProfile: () => void;
  hasKey: boolean;
  displayName?: string;
  isGuest?: boolean;
  onNewChat?: () => void;
  chatHistory?: { id: string, title: string, created_at: string }[];
  onSelectChat?: (id: string) => void;
  currentChatId?: string;
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

export default function LeftSidebar({ isOpen, onToggle, onOpenSettings, onOpenFilters, onOpenProfile, hasKey, displayName = 'Counselor', isGuest = false, onNewChat, chatHistory = [], onSelectChat, currentChatId }: Props) {
  const [search, setSearch] = useState('');
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  return (
    <div 
      className="h-full flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative flex-shrink-0 bg-white rounded-[36px] shadow-sm py-4"
      style={{ width: isOpen ? '260px' : '72px' }}
    >
      {showProfilePopup && (
        <div className="absolute bottom-12 left-full ml-4 z-[100] w-[320px] animate-fade-in origin-bottom-left">
          <ProfileCard onClose={() => setShowProfilePopup(false)} />
        </div>
      )}
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
          <SidebarItem icon={<Home size={22} strokeWidth={1.5} />} label="Home" isOpen={isOpen} />
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
          <SidebarItem icon={<HelpCircle size={22} strokeWidth={1.5} />} label="Help" isOpen={isOpen} />
          <SidebarItem icon={<Settings size={22} strokeWidth={1.5} />} label="Settings" isOpen={isOpen} onClick={onOpenSettings} />
          
          <button onClick={() => setShowProfilePopup(!showProfilePopup)} className={`h-[48px] w-full flex items-center ${isOpen ? 'px-3 rounded-2xl' : 'justify-center rounded-full'} hover:bg-[#FDF0E7] transition-colors relative group`}>
            <div className="w-[48px] h-[48px] shrink-0 flex items-center justify-center">
              <div className="w-[28px] h-[28px] rounded-full bg-[#FDF0E7] flex items-center justify-center overflow-hidden border border-orange-900/10">
                 <User size={16} className="text-[#D16F54]" />
              </div>
            </div>
            <span className={`flex flex-col items-start transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
              <span className="text-[13px] font-medium text-gray-700 leading-tight">{displayName}</span>
              <span className="text-[11px] text-gray-500 leading-tight">{isGuest ? 'Guest' : 'Pro'}</span>
            </span>
            {!isOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {displayName}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
