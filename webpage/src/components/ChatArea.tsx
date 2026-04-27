import { useRef, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Scale, Search, Gavel, FileText, Link, BookOpen, Cpu, Copy, Check } from 'lucide-react';

interface CaseCard {
  id: number; case_no: string; bench: string; date: string;
  outcome: string; diary_no: string; excerpt: string;
}
interface Message { role: 'user' | 'assistant'; content: string; cases?: CaseCard[] }

const SUGGESTED_QUERIES = [
  { icon: Search,   label: 'Search Precedents',    query: 'Find cases on right to privacy under Article 21' },
  { icon: Gavel,    label: 'Bench Tendencies',     query: 'How does the constitutional bench rule on property rights?' },
  { icon: FileText, label: 'Summarize Doctrine',   query: 'What is the basic structure doctrine and key cases?' },
  { icon: Link,     label: 'Link Related Cases',   query: 'Cases related to bail under NDPS Act section 37' },
  { icon: BookOpen, label: 'Cross-reference Law',  query: 'Cases where Section 302 IPC intersects with Article 21' },
  { icon: Scale,    label: 'Outcome Pattern',      query: 'Dismissal rate for contempt of court petitions since 2010' },
  { icon: Search,   label: 'Habeas Corpus',        query: 'Landmark rulings on Habeas Corpus against preventive detention' },
  { icon: Gavel,    label: 'Environmental Law',    query: 'Supreme court judgments on polluter pays principle' },
  { icon: FileText, label: 'Taxation Disputes',    query: 'Retrospective taxation judgments involving telecom companies' },
  { icon: Link,     label: 'Corporate Law',        query: 'Oppression and mismanagement cases under Companies Act' },
  { icon: BookOpen, label: 'Family Law',           query: 'Divorce by mutual consent and waiver of cooling off period' },
  { icon: Scale,    label: 'Arbitration',          query: 'Scope of judicial intervention in arbitral awards under Section 34' },
  { icon: Search,   label: 'Intellectual Property',query: 'Copyright infringement and fair dealing in educational materials' },
  { icon: Gavel,    label: 'Labor Law',            query: 'Regularization of contract workers in PSUs' },
  { icon: FileText, label: 'Criminal Appeals',     query: 'Standard of proof for circumstantial evidence in murder trials' },
  { icon: Link,     label: 'Insolvency',           query: 'Priority of financial creditors under IBC' },
  { icon: BookOpen, label: 'Constitutional Law',   query: 'Scope of pardoning power of the Governor under Article 161' },
  { icon: Scale,    label: 'Consumer Protection',  query: 'Medical negligence liability under Consumer Protection Act' },
  { icon: Search,   label: 'Elections',            query: 'Disqualification of elected representatives upon conviction' },
  { icon: Gavel,    label: 'Banking',              query: 'RBI regulations and cryptocurrencies' }
];

interface Props {
  messages: Message[];
  isLoading: boolean;
  modelType: 'gemini' | 'ollama';
  isDark: boolean; // Retained for prop signature, but forced dark visually
  onQueryClick: (q: string) => void;
}

export default function ChatArea({ messages, isLoading, modelType, isDark, onQueryClick }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  // Randomly select 4 queries on initial mount
  const randomQueries = useMemo(() => {
    const shuffled = [...SUGGESTED_QUERIES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const T = {
    text:         'var(--chat-text)',
    textMuted:    'var(--chat-text-muted)',
    textFaint:    'rgba(128,128,128,0.3)',
    surface:      'transparent',
    border:       'var(--chat-border)',
    userBubble:   'rgba(128,128,128,0.05)',
    userText:     'var(--chat-text)',
    iconBg:       'var(--accent-bg)',
    iconColor:    'var(--accent-text)',
    analysisText: 'var(--chat-text)',
    bg:           'transparent',
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center px-6 pb-8 overflow-y-auto no-scrollbar font-inter"
        style={{ background: T.bg }}>
        
        {/* Greeting positioned high up */}
        <div className="mt-12 text-center flex flex-col items-center z-10 w-full">
          <h1 className="text-[32px] font-bold mb-2 font-inter" style={{ color: T.text }}>
            Hi, Counselor
          </h1>
          <p className="text-[15px] font-inter" style={{ color: T.textMuted }}>
            What can I help you with?
          </p>
        </div>

        {/* Prompts positioned lower down */}
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto mb-4 z-10">
          {randomQueries.map((item, i) => (
            <button
              key={i}
              onClick={() => onQueryClick(item.query)}
              className="flex flex-col gap-2 p-4 text-left transition-all duration-200"
              style={{ 
                background: 'rgba(128, 128, 128, 0.03)', 
                border: '1px solid transparent',
                borderRadius: isDark ? '0px' : '12px',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(128, 128, 128, 0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(128, 128, 128, 0.03)';
              }}
            >
              <div className="flex items-center gap-2">
                <item.icon size={14} style={{ color: T.textMuted }} />
                <p className="text-[13px] font-semibold font-inter truncate" style={{ color: T.text }}>{item.label}</p>
              </div>
              <p className="text-[12px] font-inter truncate w-full" style={{ color: T.textMuted, opacity: 0.8 }}>{item.query}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-8 pb-6 pt-16 font-inter"
      style={{ background: T.bg }}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div
                className="px-5 py-4 max-w-[85%] text-[15px] leading-relaxed"
                style={{ background: T.userBubble, color: T.userText, border: `1px solid ${T.border}`, borderRadius: 'var(--radius-md) var(--radius-md) 0 var(--radius-md)' }}
              >
                {msg.content}
              </div>
            ) : (
              <div className="w-full">
                {/* AI label */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center"
                    style={{ background: T.iconBg, borderRadius: 'var(--radius-sm)' }}>
                    <Scale size={11} style={{ color: T.iconColor }} />
                  </div>
                  <span className="text-xs uppercase tracking-[1px] font-tags" style={{ color: T.text }}>LAWW AI</span>
                  <span style={{ color: T.border }} className="text-xs">|</span>
                  <span className="text-[10px] uppercase tracking-[1px] flex items-center gap-1.5 font-tags" style={{ color: T.textMuted }}>
                    <Cpu size={10} /> {modelType === 'gemini' ? 'Gemini 2.5 Flash' : 'Ollama'}
                  </span>
                </div>

                {/* Markdown or loading */}
                {msg.content ? (
                  <div className="group relative">
                    <div
                      className="md-body text-[15px]"
                      style={{ color: T.analysisText }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  isLoading && i === messages.length - 1 ? (
                    <span className="flex items-center gap-3 text-xs uppercase tracking-[1px] font-tags" style={{ color: T.textMuted }}>
                      <span className="flex gap-1.5">
                        {[0, 1, 2].map(d => (
                          <span
                            key={d}
                            className="w-1.5 h-1.5 animate-pulse"
                            style={{ background: 'var(--chat-text)', animationDelay: `${d * 0.15}s`, borderRadius: '50%' }}
                          />
                        ))}
                      </span>
                      <span>{msg.cases && msg.cases.length > 0 ? 'Generating Analysis' : 'Fetching Cases'}</span>
                    </span>
                  ) : null
                )}

                {/* Footer Actions */}
                <div className="mt-6 flex items-center gap-2 flex-wrap">
                  {/* Case count badge */}
                  {msg.cases && msg.cases.length > 0 && (
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[1px] font-tags"
                      style={{ background: 'transparent', color: 'var(--chat-text-muted)', border: `1px solid ${T.border}`, borderRadius: 'var(--radius-sm)' }}
                    >
                      <Scale size={11} />
                      {msg.cases.length} Precedents Loaded — See Right Panel
                    </div>
                  )}

                  {/* Copy Button (only shown if there's content) */}
                  {msg.content && (
                    <button
                      onClick={() => handleCopy(msg.content, i)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-[1px] font-tags transition-colors"
                      style={{ color: copiedIndex === i ? 'var(--chat-text)' : 'var(--chat-text-muted)', border: '1px solid transparent', borderRadius: 'var(--radius-sm)' }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = T.border;
                        (e.currentTarget as HTMLElement).style.color = 'var(--chat-text)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = copiedIndex === i ? 'var(--chat-text)' : 'var(--chat-text-muted)';
                      }}
                      title="Copy response"
                    >
                      {copiedIndex === i ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                      {copiedIndex === i ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
