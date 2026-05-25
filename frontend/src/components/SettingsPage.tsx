import React, { useState } from 'react';
import { User, Server, Download, Trash2, ChevronLeft, Save, LogOut, Eye, EyeOff, CheckCircle2, RefreshCw, Play, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface SettingsPageProps {
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  provider: 'gemini' | 'ollama';
  setProvider: (p: 'gemini' | 'ollama') => void;
  ollamaModels: string[];
  selectedOllamaModel: string;
  setSelectedOllamaModel: (m: string) => void;
  userSession: any;
  messages: any[];
  setMessages: (messages: any[]) => void;
  fetchOllamaModels?: () => Promise<void>;
}

const DEFAULT_SYSTEM_PROMPT = `You are VORA — a senior Indian legal intelligence system...`;

export default function SettingsPage({
  onClose, apiKey, setApiKey, provider, setProvider,
  ollamaModels, selectedOllamaModel, setSelectedOllamaModel,
  userSession, messages, setMessages, fetchOllamaModels
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'models' | 'data'>('models');
  const [systemPrompt, setSystemPrompt] = useState(
    () => localStorage.getItem('vora_system_prompt') || DEFAULT_SYSTEM_PROMPT
  );
  const [localProvider, setLocalProvider] = useState(provider);
  const [localOllamaModel, setLocalOllamaModel] = useState(selectedOllamaModel);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStartingOllama, setIsStartingOllama] = useState(false);

  const handleRefreshModels = async () => {
    if (fetchOllamaModels) {
      setIsRefreshing(true);
      await fetchOllamaModels();
      setIsRefreshing(false);
    }
  };

  const handleStartOllama = async () => {
    setIsStartingOllama(true);
    try {
      await fetch('/api/start-ollama', { method: 'POST' });
      // Give it a second to spin up
      setTimeout(() => {
        handleRefreshModels();
        setIsStartingOllama(false);
      }, 2000);
    } catch (e) {
      console.error("Failed to start Ollama", e);
      setIsStartingOllama(false);
    }
  };

  // Update API key live into localStorage AND parent state
  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleProviderChange = (val: 'gemini' | 'ollama') => {
    setLocalProvider(val);
    setProvider(val);
    localStorage.setItem('vora_provider', val);
  };

  const handleOllamaModelChange = (val: string) => {
    setLocalOllamaModel(val);
    setSelectedOllamaModel(val);
    localStorage.setItem('vora_ollama_model', val);
  };

  const handleSaveModels = () => {
    setApiKey(apiKey); // flush to parent
    localStorage.setItem('gemini_api_key', apiKey);
    setProvider(localProvider);
    setSelectedOllamaModel(localOllamaModel);
    localStorage.setItem('vora_system_prompt', systemPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    if (!userSession.isGuest) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('vora_guest_id');
      localStorage.removeItem('vora_guest_name');
      window.location.reload();
    }
  };

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear the current chat?")) {
      setMessages([]);
    }
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return alert("No chat to download.");
    const content = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}\n`).join('\n---\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vora_Chat_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full bg-white text-[#333] flex flex-col relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-900/5 rounded-[2rem] animate-fade-in font-sans">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-4 p-6 border-b border-orange-900/10">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#FDF0E7] text-[#D16F54] transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#333]">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account, models, and data.</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 border-r border-orange-900/10 p-6 flex flex-col gap-2 bg-[#FDF0E7]/30">
          <button 
            onClick={() => setActiveTab('models')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${activeTab === 'models' ? 'bg-[#FDF0E7] text-[#D16F54]' : 'text-gray-600 hover:bg-[#FDF0E7]/50 hover:text-[#D16F54]'}`}
          >
            <Server size={18} />
            Model Configuration
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${activeTab === 'account' ? 'bg-[#FDF0E7] text-[#D16F54]' : 'text-gray-600 hover:bg-[#FDF0E7]/50 hover:text-[#D16F54]'}`}
          >
            <User size={18} />
            Account Settings
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${activeTab === 'data' ? 'bg-[#FDF0E7] text-[#D16F54]' : 'text-gray-600 hover:bg-[#FDF0E7]/50 hover:text-[#D16F54]'}`}
          >
            <DatabaseIcon size={18} />
            Data & Privacy
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
          
          {/* MODEL SETTINGS */}
          {activeTab === 'models' && (
            <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div>
                <h2 className="text-xl font-bold text-[#333] mb-6">AI Provider</h2>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleProviderChange('gemini')}
                    className={`flex-1 p-6 rounded-2xl border-2 transition-all text-left ${localProvider === 'gemini' ? 'border-[#D16F54] bg-[#FDF0E7]/50' : 'border-gray-100 hover:border-[#D16F54]/30'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${localProvider === 'gemini' ? 'bg-[#D16F54] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <SparklesIcon size={20} />
                      </div>
                      <h3 className="font-bold text-lg">Gemini (Cloud)</h3>
                    </div>
                    <p className="text-sm text-gray-500">Use Google's Gemini models. Requires API Key. Best for speed and reasoning.</p>
                  </button>

                  <button 
                    onClick={() => handleProviderChange('ollama')}
                    className={`flex-1 p-6 rounded-2xl border-2 transition-all text-left ${localProvider === 'ollama' ? 'border-[#D16F54] bg-[#FDF0E7]/50' : 'border-gray-100 hover:border-[#D16F54]/30'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${localProvider === 'ollama' ? 'bg-[#D16F54] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <CpuIcon size={20} />
                      </div>
                      <h3 className="font-bold text-lg">Ollama (Local)</h3>
                    </div>
                    <p className="text-sm text-gray-500">Run models locally on your machine. 100% private. Slower on standard hardware.</p>
                  </button>
                </div>
              </div>

              {localProvider === 'gemini' && (
                <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#333]">Gemini API Key</h3>
                    {apiKey && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Key saved</span>}
                  </div>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm text-gray-800 outline-none focus:border-[#D16F54] focus:ring-1 focus:ring-[#D16F54] transition-all font-mono"
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={e => handleApiKeyChange(e.target.value)}
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Get a free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[#D16F54] hover:underline font-semibold">aistudio.google.com</a>. Key is saved locally in your browser.</p>
                </div>
              )}

              {localProvider === 'ollama' && (
                <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#333]">Local Model Selection</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleStartOllama}
                        disabled={isStartingOllama}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:border-[#D16F54] transition-all text-gray-600 disabled:opacity-50"
                      >
                        <Play size={14} className={isStartingOllama ? "animate-pulse text-[#D16F54]" : ""} />
                        {isStartingOllama ? "Starting..." : "Start Ollama"}
                      </button>
                      <button 
                        onClick={handleRefreshModels}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:border-[#D16F54] transition-all text-gray-600 disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#D16F54]" : ""} />
                        Refresh
                      </button>
                    </div>
                  </div>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#D16F54] focus:ring-1 focus:ring-[#D16F54] transition-all appearance-none"
                    value={localOllamaModel}
                    onChange={e => handleOllamaModelChange(e.target.value)}
                  >
                    {ollamaModels.length > 0 ? (
                      ollamaModels.map(m => <option key={m} value={m}>{m}</option>)
                    ) : (
                      <option value="">No local models found — is Ollama running?</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500">Ensure Ollama is running or click Start Ollama above.</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#333]">System Prompt</h3>
                  <button onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)} className="text-xs text-[#D16F54] font-semibold hover:underline">
                    Reset to Default
                  </button>
                </div>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-800 outline-none focus:border-[#D16F54] focus:ring-1 focus:ring-[#D16F54] transition-all resize-none font-mono leading-relaxed"
                  rows={8}
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                />
                <p className="text-xs text-gray-500">Dictates how the AI behaves. Changes will be saved locally.</p>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                {saved && (
                  <span className="flex items-center gap-1.5 text-green-600 font-semibold text-sm animate-fade-in">
                    <CheckCircle2 size={16} /> Configuration saved!
                  </span>
                )}
                <button onClick={handleSaveModels} className="bg-[#D16F54] hover:bg-[#ba624a] text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-[#D16F54]/20 transition-all flex items-center gap-2">
                  <Save size={18} />
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {/* ACCOUNT SETTINGS */}
          {activeTab === 'account' && (
            <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-bold text-[#333] mb-6">Account Profile</h2>
              
              <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-20 h-20 bg-white border-4 border-[#FDF0E7] rounded-full flex items-center justify-center text-3xl font-bold shadow-sm">
                  <User size={32} className="text-[#D16F54]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#333]">{userSession?.displayName}</h3>
                  <p className="text-sm text-[#D16F54] font-semibold tracking-wider uppercase mt-1">
                    {userSession?.isGuest ? 'Guest Counselor' : 'Verified Counselor'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <h3 className="font-bold text-[#333]">Session Management</h3>
                <div className="p-6 border border-gray-200 rounded-2xl flex items-center justify-between bg-white">
                  <div>
                    <h4 className="font-semibold text-gray-800">Sign Out</h4>
                    <p className="text-sm text-gray-500 mt-1">End your current session and return to the login screen.</p>
                  </div>
                  <button onClick={handleSignOut} className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-xl flex items-center gap-2 transition-colors">
                    <LogOut size={18} />
                    {userSession?.isGuest ? 'End Guest Session' : 'Sign Out'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DATA SETTINGS */}
          {activeTab === 'data' && (
            <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-bold text-[#333] mb-6">Data & Privacy</h2>
              
              <div className="space-y-4">
                <div className="p-6 border border-gray-200 rounded-2xl flex items-center justify-between bg-white hover:border-[#D16F54]/30 transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-800">Download Chat History</h4>
                    <p className="text-sm text-gray-500 mt-1">Export the current conversation as a text file.</p>
                  </div>
                  <button onClick={handleDownloadChat} className="px-6 py-2.5 bg-[#FDF0E7] text-[#D16F54] hover:bg-[#F2D1C9] font-semibold rounded-xl flex items-center gap-2 transition-colors">
                    <Download size={18} />
                    Download
                  </button>
                </div>

                <div className="p-6 border border-red-100 rounded-2xl flex items-center justify-between bg-red-50/50">
                  <div>
                    <h4 className="font-semibold text-red-800">Clear Current Chat</h4>
                    <p className="text-sm text-red-600/70 mt-1">Permanently delete messages in the current view.</p>
                  </div>
                  <button onClick={handleClearChat} className="px-6 py-2.5 bg-red-100 text-red-600 hover:bg-red-200 font-semibold rounded-xl flex items-center gap-2 transition-colors">
                    <Trash2 size={18} />
                    Clear Chat
                  </button>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-gray-100">
                <button 
                  onClick={() => document.getElementById('privacy-trigger')?.click()}
                  className="text-[#D16F54] font-medium hover:underline flex items-center gap-2"
                >
                  <ShieldCheck size={18} />
                  View Full Privacy Policy
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Learn how Vora Legal handles client confidentiality, local data processing, and telemetry.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Minimal Icons for UI
function DatabaseIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
    </svg>
  );
}

function CpuIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>
  );
}
