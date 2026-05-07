import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export interface CaseCard {
  case_no: string;
  bench: string;
  date: string;
  outcome: string;
  diary_no: string;
  url: string | null;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  cases?: CaseCard[];
}

// API URL: when deployed on Vercel, use relative "/api" so Vercel's rewrite proxy handles CORS.
// When running locally, use the env var or fallback to localhost.
const IS_VERCEL = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE = IS_VERCEL
  ? ''                                                              // relative – Vercel rewrites /api/* to ngrok
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');    // local dev

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('gemini_api_key') || '');
  const [searchCases, setSearchCases] = useState(true);
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [isLoading, setIsLoading] = useState(false);

  const [provider, setProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch available Ollama models from the backend
    fetch(`${API_BASE}/api/models`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.models) {
          const models = data.models.map((m: any) => m.name);
          setOllamaModels(models);
          if (models.length > 0) setSelectedOllamaModel(models[0]);
        }
      })
      .catch(err => console.log('Ollama models not reachable via backend:', err));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    if (provider === 'gemini' && !apiKey) {
      alert('Please set your Gemini API Key in the sidebar.');
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const n_results = depth === 'quick' ? 5 : depth === 'standard' ? 10 : 25;

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          query: userMessage.content,
          api_key: apiKey || 'none',
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

      let assistantMessage: Message = { role: 'assistant', content: '', cases: [] };
      setMessages(prev => [...prev, assistantMessage]);

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

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-title">VORA / ヴォラ</div>

        <div className="settings-block">
          <label className="message-role">PROVIDER</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              className={`btn-sharp ${provider === 'gemini' ? 'active' : ''}`}
              style={{ flex: 1, backgroundColor: provider === 'gemini' ? '#000' : 'transparent', color: provider === 'gemini' ? '#f7f6f0' : '#000' }}
              onClick={() => setProvider('gemini')}
            >
              Gemini
            </button>
            <button
              className={`btn-sharp ${provider === 'ollama' ? 'active' : ''}`}
              style={{ flex: 1, backgroundColor: provider === 'ollama' ? '#000' : 'transparent', color: provider === 'ollama' ? '#f7f6f0' : '#000' }}
              onClick={() => setProvider('ollama')}
            >
              Ollama
            </button>
          </div>

          {provider === 'gemini' ? (
            <>
              <label className="message-role">GEMINI API KEY</label>
              <input
                type="password"
                className="input-sharp"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </>
          ) : (
            <>
              <label className="message-role">OLLAMA MODEL</label>
              <select
                className="input-sharp"
                value={selectedOllamaModel}
                onChange={e => setSelectedOllamaModel(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {ollamaModels.length > 0 ? (
                  ollamaModels.map(m => <option key={m} value={m}>{m}</option>)
                ) : (
                  <option value="">No local models found</option>
                )}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-container">
        <div className="messages-area">
          {messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5 }}>
              <div className="sidebar-title" style={{ border: 'none', fontSize: '2rem' }}>VORA</div>
              <p>Legal Intelligence System</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-role">{msg.role === 'user' ? 'USER / ユーザー' : 'VORA / アシスタント'}</div>
                {msg.role === 'assistant' ? (
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.cases && msg.cases.length > 0 && (
                      <div className="cases-grid">
                        {msg.cases.map((c, i) => (
                          <div key={i} className="case-card">
                            <div className="case-title">Case {c.case_no}</div>
                            <div className="case-meta">Bench: {c.bench}</div>
                            <div className="case-meta">Date: {c.date}</div>
                            <div className="case-meta">Outcome: {c.outcome}</div>
                            {c.url && (
                              <a href={c.url} target="_blank" rel="noreferrer" className="btn-sharp">Read PDF</a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>{msg.content}</div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Bar */}
        <div className="prompt-bar-container">
          <div className="controls-row">
            <div className="control-item">
              <input
                type="checkbox"
                checked={searchCases}
                onChange={e => setSearchCases(e.target.checked)}
                id="rag-toggle"
              />
              <label htmlFor="rag-toggle">ENABLE RAG</label>
            </div>
            <div className="control-item">
              <label>DEPTH:</label>
              <select
                value={depth}
                onChange={e => setDepth(e.target.value as any)}
                className="input-sharp"
                style={{ width: 'auto', margin: 0, padding: '2px 8px' }}
              >
                <option value="quick">QUICK (5)</option>
                <option value="standard">STANDARD (10)</option>
                <option value="deep">DEEP (25)</option>
              </select>
            </div>
          </div>

          <div className="textarea-container">
            <textarea
              className="textarea-sharp"
              placeholder="Query the Indian Supreme Court database..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            {isLoading ? (
              <button className="send-btn red" onClick={handleStop}>STOP</button>
            ) : (
              <button className="send-btn" onClick={handleSubmit} disabled={!input.trim()}>SEND</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
