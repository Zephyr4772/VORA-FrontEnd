import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ChatArea from './components/ChatArea';
import LeftSidebar from './components/LeftSidebar';
import RightPanel from './components/RightPanel';
import FilterPanel, { FilterState, DEFAULT_FILTERS } from './components/FilterPanel';
import ClaudeChatInput from './components/ui/claude-style-chat-input';
import AuthModal from './components/AuthModal';
import SettingsPage from './components/SettingsPage';
import HelpPage from './components/HelpPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import { supabase } from './supabaseClient';

export interface CaseCard {
  id: number;
  case_no: string;
  bench: string;
  date: string;
  outcome: string;
  diary_no: string;
  excerpt: string;
  download_url?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  cases?: CaseCard[];
}

import { UserSession } from './App';

const IS_VERCEL = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE = IS_VERCEL ? '' : (import.meta.env.VITE_API_URL || '');

export default function ChatPage({ 
  userSession, 
  setUserSession,
  onSignIn 
}: { 
  userSession: UserSession;
  setUserSession: React.Dispatch<React.SetStateAction<UserSession | null>>;
  onSignIn: (userId: string, displayName: string) => void;
}) {
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'settings' | 'help' | 'privacy'>('chat');

  const [messages, setMessages] = useState<Message[]>([]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [provider, setProvider] = useState<'gemini' | 'ollama'>(() => (localStorage.getItem('vora_provider') as 'gemini' | 'ollama') || 'gemini');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>(() => localStorage.getItem('vora_ollama_model') || '');

  const [cases, setCases] = useState<CaseCard[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isRagEnabled, setIsRagEnabled] = useState(true);

  const [chatHistory, setChatHistory] = useState<{ id: string, title: string, created_at: string }[]>([]);

  const fetchOllamaModels = async () => {
    try {
      const res = await fetch('/ollama/api/tags');
      if (res.ok) {
        const data = await res.json();
        const models = data.models.map((m: any) => m.name);
        setOllamaModels(models);
        if (models.length > 0 && !selectedOllamaModel) {
          setSelectedOllamaModel(models[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
    }
  };

  useEffect(() => {
    if (provider === 'ollama') {
      fetchOllamaModels();
    }
  }, [provider]);

  // Fetch history — only for authenticated (non-guest) users
  const refreshHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) console.error('History fetch error:', error.message);
    if (data) setChatHistory(data);
  };

  useEffect(() => {
    if (!userSession || userSession.isGuest) return;
    refreshHistory(userSession.userId);
  }, [userSession?.userId]);

  const loadChat = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, cases, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) { console.error('Load chat error:', error.message); return; }

    if (data) {
      setMessages(data.map((m: any) => ({
        role: m.role,
        content: m.content,
        cases: m.cases || []
      })));
      setCases([]);
      setIsRightOpen(false);
      setUserSession(prev => prev ? { ...prev, dbSessionId: sessionId } : null);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const prevCasesLength = useRef(cases.length);
  useEffect(() => {
    if (cases.length > prevCasesLength.current && cases.length > 0) {
      setIsRightOpen(true);
    }
    prevCasesLength.current = cases.length;
  }, [cases.length]);

  // ── (Auth session fetching was moved to App.tsx) ──

  // ── Fetch Ollama models ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/models`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then(res => {
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.models) {
          const models = data.models.map((m: any) => m.name);
          setOllamaModels(models);
          if (models.length > 0) setSelectedOllamaModel(models[0]);
        }
      })
      .catch(() => { });
  }, []);

  // ── Persist API key ──────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  // ── (Auth complete handler was moved to App.tsx) ──

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setCases([]);
    setIsRightOpen(false);

    if (!userSession || userSession.isGuest) {
      // Guests just clear state — no DB session
      setUserSession(prev => prev ? { ...prev, dbSessionId: undefined } : null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({ user_id: userSession.userId, title: 'New Consultation' })
        .select('id')
        .single();
      if (error) console.error('New chat error:', error.message);
      if (data) {
        setUserSession({ ...userSession, dbSessionId: data.id });
        // Immediately add to sidebar
        setChatHistory(prev => [{ id: data.id, title: 'New Consultation', created_at: new Date().toISOString() }, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  // ── Save message to Supabase ─────────────────────────────────────────────────
  const saveMessage = async (
    role: 'user' | 'assistant',
    content: string,
    msgCases: CaseCard[] = [],
    sessionIdOverride?: string
  ) => {
    // Guests don't persist
    if (!userSession || userSession.isGuest) return;

    const activeSessionId = sessionIdOverride || userSession.dbSessionId;
    if (!activeSessionId) return;

    const { error } = await supabase.from('messages').insert({
      session_id: activeSessionId,
      role,
      content,
      cases: msgCases,
    });
    if (error) console.error('Save message error:', error.message);

    // On first user message: rename session to the query text, refresh sidebar
    if (messages.length === 0 && role === 'user') {
      const title = content.length > 60 ? content.substring(0, 60) + '…' : content;
      await supabase.from('sessions').update({ title, updated_at: new Date().toISOString() }).eq('id', activeSessionId);
      // Update sidebar in place without a full refetch
      setChatHistory(prev =>
        prev.map(c => c.id === activeSessionId ? { ...c, title } : c)
      );
    }
  };

  const handleSubmit = async (query: string, searchCases: boolean, depth: 'quick' | 'standard' | 'deep' | number) => {
    if (!query.trim()) return;
    if (provider === 'gemini' && !apiKey) {
      setCurrentView('settings');
      return;
    }

    // For authenticated users: ensure we have an active session
    let activeSessionId = userSession?.dbSessionId;
    if (userSession && !userSession.isGuest && !activeSessionId) {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .insert({ user_id: userSession.userId, title: 'New Consultation' })
          .select('id')
          .single();
        if (error) console.error('Auto-create session error:', error.message);
        if (data) {
          activeSessionId = data.id;
          setUserSession(prev => prev ? { ...prev, dbSessionId: data.id } : null);
          setChatHistory(prev => [{ id: data.id, title: 'New Consultation', created_at: new Date().toISOString() }, ...prev]);
        }
      } catch (err) {
        console.error('Failed to auto-create session:', err);
      }
    }

    const userMessage: Message = { role: 'user', content: query };
    let assistantMessage: Message = { role: 'assistant', content: '', cases: [] };
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    if (searchCases) setIsRightOpen(true);

    // Persist user message (no-op for guests)
    await saveMessage('user', query, [], activeSessionId);

    const n_results = typeof depth === 'number' ? depth : depth === 'quick' ? 5 : depth === 'standard' ? 10 : 25;
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          query,
          api_key: provider === 'ollama' ? 'ollama-local' : (apiKey || 'none'),
          n_results,
          search_cases: searchCases,
          provider: provider,
          model_name: provider === 'ollama' ? selectedOllamaModel : 'gemini-2.5-flash'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to fetch from backend');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim() !== '');

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'cases') {
              assistantMessage.cases = data.data;
              setCases(data.data);
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1] = { ...assistantMessage };
                return newArr;
              });
            } else if (data.type === 'chunk') {
              assistantMessage.content += data.text;
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1] = { ...assistantMessage };
                return newArr;
              });
            } else if (data.type === 'error') {
              assistantMessage.content += `\n\n**Error**: ${data.message}`;
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1] = { ...assistantMessage };
                return newArr;
              });
            }
          } catch (e) {
            console.error('JSON parse error on chunk:', line);
          }
        }
      }

      // Persist full assistant response (no-op for guests)
      await saveMessage('assistant', assistantMessage.content, assistantMessage.cases || [], activeSessionId);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${err.message}` }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const filteredCases = cases.filter(c => {
    if (filters.outcomes.length > 0) {
      const match = filters.outcomes.some(k => c.outcome.toLowerCase().includes(k));
      if (!match) return false;
    }
    if (filters.bench_includes && !c.bench.toLowerCase().includes(filters.bench_includes.toLowerCase())) return false;
    return true;
  });

  // ── (Auth gate was moved to App.tsx) ──

  return (
    <>
      <div className="flex h-screen bg-[#FDF0E7] overflow-hidden text-gray-800 p-4 gap-4 font-sans selection:bg-[#7B5EE3]/30">

        {/* LEFT SIDEBAR */}
        <LeftSidebar
          isOpen={isLeftOpen}
          onToggle={() => setIsLeftOpen(!isLeftOpen)}
          onOpenSettings={() => setCurrentView('settings')}
          onOpenFilters={() => setShowFilters(true)}
          onOpenProfile={() => setCurrentView('settings')}
          onHome={() => setCurrentView('chat')}
          onOpenHelp={() => setCurrentView('help')}
          onNewChat={handleNewChat}
          hasKey={!!apiKey}
          displayName={userSession.displayName}
          isGuest={userSession.isGuest}
          chatHistory={chatHistory}
          onSelectChat={loadChat}
          currentChatId={userSession.dbSessionId}
          onSignIn={onSignIn}
        />

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 transition-all duration-300 ease-in-out h-full relative">
          <div className="h-full bg-white text-black flex flex-col relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-900/5 rounded-[2rem]">

            {/* Bottom Right Toggle */}
            {currentView === 'chat' && cases.length > 0 && (
              <div className="absolute bottom-8 right-8 z-50 flex items-center animate-fade-in">
                <button
                  onClick={() => setIsRightOpen(!isRightOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF0E7] text-[#D16F54] hover:bg-[#F2D1C9] hover:text-white transition-colors shadow-sm"
                  aria-label="Toggle Precedents Panel"
                >
                  {isRightOpen ? <ChevronRight size={20} strokeWidth={2.5} /> : <ChevronLeft size={20} strokeWidth={2.5} />}
                </button>
              </div>
            )}

            {currentView === 'settings' ? (
              <SettingsPage
                onClose={() => setCurrentView('chat')}
                apiKey={apiKey}
                setApiKey={setApiKey}
                provider={provider}
                setProvider={setProvider}
                ollamaModels={ollamaModels}
                selectedOllamaModel={selectedOllamaModel}
                setSelectedOllamaModel={setSelectedOllamaModel}
                userSession={userSession}
                messages={messages}
                setMessages={setMessages}
                fetchOllamaModels={fetchOllamaModels}
              />
            ) : currentView === 'help' ? (
              <HelpPage onClose={() => setCurrentView('chat')} />
            ) : currentView === 'privacy' ? (
              <PrivacyPolicy onClose={() => setCurrentView('chat')} />
            ) : (
              <>
                {/* Chat Container or Empty State */}
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 w-full h-full absolute inset-0 pb-[21rem] pointer-events-none">
                    <div className="flex items-center justify-center gap-3 animate-fade-in">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D16F54" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      <h1 className="text-[32px] text-[#333] font-serif tracking-tight font-medium">
                        {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {userSession.displayName?.split(' ')[0] || 'User'}
                      </h1>
                    </div>
                  </div>
                ) : (
                  <ChatArea
                    messages={messages}
                    isLoading={isLoading}
                    modelType={provider}
                    isDark={false}
                    onQueryClick={(q) => handleSubmit(q, true, 'standard')}
                  />
                )}

                {/* Prompt Bar (Dynamically positioned) */}
                <div className={`absolute left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${messages.length === 0 ? 'bottom-[50%] translate-y-[50%] mt-8' : 'bottom-6 translate-y-0'
                  }`}>
                  <ClaudeChatInput
                    hasMessages={messages.length > 0}
                    onOpenFilters={() => setShowFilters(true)}
                    isRagEnabled={isRagEnabled}
                    onToggleRag={() => setIsRagEnabled(!isRagEnabled)}
                    onSendMessage={(data) => {
                      const message = data.message;
                      handleSubmit(message, isRagEnabled, data.numCases);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <RightPanel
          isOpen={isRightOpen}
          onToggle={() => setIsRightOpen(!isRightOpen)}
          cases={cases}
          filteredCases={filteredCases}
          filters={filters}
          setFilters={setFilters}
          onOpenFilters={() => setShowFilters(true)}
        />
        
        {/* Global listener for a privacy view trigger if needed from other components */}
        <div id="privacy-trigger" className="hidden" onClick={() => setCurrentView('privacy')} />
      </div>

      {/* MODALS */}
      <FilterPanel
        show={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        cases={cases}
      />
    </>
  );
}
