import { X, LogOut, RefreshCw, FolderDown, User } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface Props {
  show: boolean;
  onClose: () => void;
  userSession: {
    userId: string;
    isGuest: boolean;
    displayName: string;
  } | null;
}

export default function UserProfileModal({ show, onClose, userSession }: Props) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  if (!show || !userSession) return null;

  const handleSignOut = async () => {
    if (userSession.isGuest) {
      localStorage.removeItem('vora_guest_id');
      localStorage.removeItem('vora_guest_name');
      window.location.reload();
    } else {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncing(true);
    setSyncMessage('Syncing with Google Drive...');
    try {
      // Use relative path for Vercel deployment, absolute for local if needed
      const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/admin/sync_drive`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSyncMessage('Sync successful. Vault is up to date.');
      } else {
        setSyncMessage(`Sync failed: ${data.message}`);
      }
    } catch (err) {
      setSyncMessage('Error connecting to backend.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-xl text-[#333] w-[420px] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-orange-900/10 overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative h-28 bg-gradient-to-br from-[#D16F54] via-[#D97757] to-[#E5AA7F]">
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-white backdrop-blur-sm">
            <X size={16} />
          </button>
        </div>
        
        {/* Profile Info */}
        <div className="px-8 pb-8 relative">
          <div className="absolute -top-12 left-8 w-24 h-24 bg-white border-4 border-[#FDF0E7] rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
            <User size={40} className="text-[#D16F54]" />
          </div>
          
          <div className="mt-16 mb-8">
            <h2 className="text-2xl font-bold text-[#333] tracking-tight">{userSession.displayName}</h2>
            <p className="text-xs text-[#D16F54] font-semibold tracking-[0.2em] uppercase mt-1">{userSession.isGuest ? 'Guest Counselor' : 'Verified Counselor'}</p>
          </div>

          <div className="space-y-4">
            {/* Action: Drive Sync */}
            <div className="p-5 bg-[#FDF0E7] border border-orange-900/10 rounded-2xl flex flex-col gap-4 transition-colors hover:bg-[#F2D1C9]/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <FolderDown size={20} className="text-[#D16F54]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#333]">Vault Integration</div>
                  <div className="text-xs text-gray-500 mt-0.5">Sync Google Drive precedents</div>
                </div>
              </div>
              <button 
                onClick={handleSyncDrive} 
                disabled={isSyncing}
                className="w-full py-3 bg-white hover:bg-gray-50 disabled:opacity-50 text-[#D16F54] text-xs font-semibold tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors border border-orange-900/10 shadow-sm"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin text-[#D16F54]' : ''} /> 
                {isSyncing ? 'SYNCING...' : 'SYNC DRIVE FOLDER'}
              </button>
              {syncMessage && (
                <div className="text-[11px] text-center text-gray-500 px-2 font-mono">{syncMessage}</div>
              )}
            </div>

            {/* Action: Logout */}
            <button 
              onClick={handleSignOut}
              className="w-full p-4 bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 rounded-2xl flex items-center justify-between transition-colors group"
            >
              <span className="text-sm font-semibold">{userSession.isGuest ? 'End Guest Session' : 'Sign Out'}</span>
              <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
