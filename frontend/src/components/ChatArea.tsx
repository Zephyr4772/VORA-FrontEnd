import { useRef, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Scale, Search, Gavel, FileText, Link, BookOpen, Cpu, Copy, Check } from 'lucide-react';
import { GooeyLoader } from './ui/loader-10';

interface CaseCard {
  id: number; case_no: string; bench: string; date: string;
  outcome: string; diary_no: string; excerpt: string;
}
interface Message { role: 'user' | 'assistant'; content: string; cases?: CaseCard[] }

const SmoothStreamMarkdown = ({ content, isStreaming }: { content: string, isStreaming: boolean }) => {
  const [displayed, setDisplayed] = useState(content);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayed(content);
      return;
    }
    const interval = setInterval(() => {
      setDisplayed(prev => {
        if (prev === content) return prev;
        if (prev.length >= content.length) return content;
        const diff = content.length - prev.length;
        // The larger the diff, the faster it catches up (max speed capped or proportional)
        const speed = Math.max(1, Math.ceil(diff / 5)); 
        return content.slice(0, prev.length + speed);
      });
    }, 15);
    
    return () => clearInterval(interval);
  }, [content, isStreaming]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {displayed}
    </ReactMarkdown>
  );
};

const SUGGESTED_QUERIES = [
  { icon: Search, label: 'Search Precedents', query: 'Find cases on right to privacy under Article 21' },
  { icon: Gavel, label: 'Bench Tendencies', query: 'How does the constitutional bench rule on property rights?' },
  { icon: FileText, label: 'Summarize Doctrine', query: 'What is the basic structure doctrine and key cases?' },
  { icon: Link, label: 'Link Related Cases', query: 'Cases related to bail under NDPS Act section 37' },
  { icon: BookOpen, label: 'Cross-reference Law', query: 'Cases where Section 302 IPC intersects with Article 21' },
  { icon: Scale, label: 'Outcome Pattern', query: 'Dismissal rate for contempt of court petitions since 2010' },
  { icon: Search, label: 'Habeas Corpus', query: 'Landmark rulings on Habeas Corpus against preventive detention' },
  { icon: Gavel, label: 'Environmental Law', query: 'Supreme court judgments on polluter pays principle' },
  { icon: FileText, label: 'Taxation Disputes', query: 'Retrospective taxation judgments involving telecom companies' },
  { icon: Link, label: 'Corporate Law', query: 'Oppression and mismanagement cases under Companies Act' },
  { icon: BookOpen, label: 'Family Law', query: 'Divorce by mutual consent and waiver of cooling off period' },
  { icon: Scale, label: 'Arbitration', query: 'Scope of judicial intervention in arbitral awards under Section 34' },
  { icon: Search, label: 'Intellectual Property', query: 'Copyright infringement and fair dealing in educational materials' },
  { icon: Gavel, label: 'Labor Law', query: 'Regularization of contract workers in PSUs' },
  { icon: FileText, label: 'Criminal Appeals', query: 'Standard of proof for circumstantial evidence in murder trials' },
  { icon: Link, label: 'Insolvency', query: 'Priority of financial creditors under IBC' },
  { icon: BookOpen, label: 'Constitutional Law', query: 'Scope of pardoning power of the Governor under Article 161' },
  { icon: Scale, label: 'Consumer Protection', query: 'Medical negligence liability under Consumer Protection Act' },
  { icon: Search, label: 'Elections', query: 'Disqualification of elected representatives upon conviction' },
  { icon: Gavel, label: 'Banking', query: 'RBI regulations and cryptocurrencies' }
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
    text: '#333333',
    textMuted: '#888888',
    textFaint: 'rgba(209,111,84,0.3)',
    surface: 'transparent',
    border: 'rgba(209,111,84,0.2)',
    userBubble: '#D16F54',
    userText: '#FFFFFF',
    iconBg: '#D16F54',
    iconColor: '#FFFFFF',
    analysisText: '#4A3B36', // Warmer, softer dark grey
    bg: 'transparent',
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center px-6 pb-36 overflow-y-auto no-scrollbar font-inter relative"
        style={{ background: T.bg }}>
        {/* Backdrop */}
        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] max-w-[200vw] opacity-[0.14] pointer-events-none z-0 select-none">
          <img src="/bacgrop.png" alt="" className="w-full h-auto object-contain blur-[3px]" />
        </div>
        <div className="z-10 text-center mt-12">
          <h1 className="text-[38px] font-bold mb-2 font-inter text-gray-900">Hi, Counselor</h1>
          <p className="text-[16px] font-inter text-gray-400">What can I help you with?</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-8 pb-36 pt-16 font-inter"
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
                    <style>{`
                      .markdown-body { color: ${T.analysisText}; line-height: 1.7; }
                      .markdown-body p { margin-bottom: 1.2rem; }
                      .markdown-body strong { color: #2D2320; font-weight: 600; }
                      .markdown-body li { margin-bottom: 0.5rem; }
                    `}</style>
                    <div
                      className="markdown-body text-[15px]"
                      style={{ color: T.analysisText }}
                    >
                      <SmoothStreamMarkdown 
                        content={msg.content} 
                        isStreaming={isLoading && i === messages.length - 1} 
                      />
                    </div>
                  </div>
                ) : (
                  isLoading && i === messages.length - 1 ? (
                    <div className="flex items-center gap-3 mt-4 ml-1">
                      <div className="relative w-12 h-6 flex items-center justify-center">
                        <div className="scale-[0.25] origin-center">
                          <GooeyLoader />
                        </div>
                      </div>
                      <span className="text-[11px] uppercase tracking-[1.5px] font-bold text-[#D16F54] opacity-80">
                        {msg.cases && msg.cases.length > 0 ? 'Generating Analysis' : 'Fetching Precedents'}
                      </span>
                    </div>
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
