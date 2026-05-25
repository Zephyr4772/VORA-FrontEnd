import { useState, useEffect, useRef } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';

const SUGGESTIONS = [
  'Find cases on right to privacy under Article 21',
  'How does the constitutional bench rule on property rights?',
  'Bail under NDPS Act section 37 — judicial trends',
  'Cases where Section 302 IPC intersects with Article 21',
  'Scope of judicial intervention in arbitral awards under Section 34',
  'Landmark rulings on Habeas Corpus against preventive detention',
  'Medical negligence liability under Consumer Protection Act',
  'Dismissal rate for contempt of court petitions since 2010',
  'Retrospective taxation judgments involving telecom companies',
  'Regularization of contract workers in PSUs',
  'Priority of financial creditors under IBC',
  'Divorce by mutual consent and waiver of cooling off period',
  'Supreme court judgments on polluter pays principle',
  'Copyright infringement and fair dealing in educational materials',
  'Disqualification of elected representatives upon conviction',
];

interface Props {
  onSubmit: (query: string, searchCases: boolean, depth: 'quick' | 'standard' | 'deep') => void;
  onStop: () => void;
  isLoading: boolean;
  provider: 'gemini' | 'ollama';
  setProvider: (p: 'gemini' | 'ollama') => void;
}

export default function PromptBar({ onSubmit, onStop, isLoading, provider, setProvider }: Props) {
  const [input, setInput] = useState('');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [depthLabel, setDepthLabel] = useState<number>(10);

  // Cycling suggestion
  const [suggestionIdx, setSuggestionIdx] = useState(() => Math.floor(Math.random() * SUGGESTIONS.length));
  const [suggestionVisible, setSuggestionVisible] = useState(true);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      setSuggestionVisible(false);
      setTimeout(() => {
        setSuggestionIdx(i => (i + 1) % SUGGESTIONS.length);
        setSuggestionVisible(true);
      }, 400);
    };
    cycleRef.current = setInterval(cycle, 4000);
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  }, []);

  const handleSuggestionClick = () => {
    setInput(SUGGESTIONS[suggestionIdx]);
    // Reset timer so it doesn't switch right after paste
    if (cycleRef.current) clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      setSuggestionVisible(false);
      setTimeout(() => {
        setSuggestionIdx(i => (i + 1) % SUGGESTIONS.length);
        setSuggestionVisible(true);
      }, 400);
    }, 4000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(input, true, depth);
        setInput('');
      }
    }
  };

  const handleDepthSelect = (cases: number, val: 'quick' | 'standard' | 'deep') => {
    setDepth(val);
    setDepthLabel(cases);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Prompt input card */}
      <div className="bg-white rounded-[24px] shadow-lg border border-gray-100 p-2">
        <textarea
          className="w-full bg-transparent resize-none outline-none text-sm px-4 py-3 placeholder-gray-400 text-gray-800"
          rows={1}
          placeholder="Ask about cases, bench tendencies, or legal doctrine..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ minHeight: '60px' }}
        />

        {/* Integrated suggestion row */}
        {!input && !isLoading && (
          <button
            onClick={handleSuggestionClick}
            className="w-full flex items-center gap-2.5 px-4 py-2 border-t border-gray-100 hover:bg-gray-50 transition-colors rounded-b-xl group"
            style={{ opacity: suggestionVisible ? 1 : 0, transition: 'opacity 0.4s ease' }}
          >
            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest shrink-0">Try</span>
            <span className="text-[12px] text-gray-400 group-hover:text-[#007bff] transition-colors truncate text-left">
              {SUGGESTIONS[suggestionIdx]}
            </span>
          </button>
        )}

        <div className="flex items-center justify-between px-2 pb-1 mt-1">
          <div className="flex items-center gap-3 flex-wrap">
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium">
              <Paperclip size={14} /> Attach
            </button>
            
            <div className="h-4 w-px bg-gray-200"></div>
            
            <div className="flex items-center gap-1 bg-gray-50 rounded-full p-0.5">
              {[5, 10, 25].map(num => {
                const valMap: any = { 5: 'quick', 10: 'standard', 25: 'deep' };
                const isActive = depthLabel === num;
                return (
                  <button 
                    key={num}
                    onClick={() => handleDepthSelect(num, valMap[num])}
                    className={`w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                      isActive ? 'bg-[#007bff] text-white' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            
            <div className="h-4 w-px bg-gray-200"></div>

            <div className="flex items-center gap-1 bg-gray-50 rounded-full p-0.5">
              <button 
                onClick={() => setProvider('gemini')}
                className={`px-3 h-7 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                  provider === 'gemini' ? 'bg-[#007bff] text-white' : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                ✧ Gemini
              </button>
              <button 
                onClick={() => setProvider('ollama')}
                className={`px-3 h-7 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                  provider === 'ollama' ? 'bg-[#007bff] text-white' : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                ⊛ Ollama
              </button>
            </div>
          </div>

          <button 
            onClick={() => {
              if (isLoading) onStop();
              else if (input.trim()) {
                onSubmit(input, true, depth);
                setInput('');
              }
            }}
            disabled={!input.trim() && !isLoading}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isLoading 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : input.trim() 
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                  : 'bg-gray-50 text-gray-300'
            }`}
          >
            {isLoading ? <div className="w-3 h-3 bg-white rounded-sm" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
