import { useState } from 'react';
import { X, Filter, Calendar, Scale, ArrowUpRight, ChevronRight, CheckSquare, Square, Download } from 'lucide-react';
import { FilterState } from './FilterPanel';

interface CaseCard {
  id: number;
  case_no: string;
  bench: string;
  date: string;
  outcome: string;
  diary_no: string;
  excerpt: string;
  download_url?: string;
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  cases: CaseCard[];
  filteredCases: CaseCard[];
  filters: FilterState;
  setFilters: (f: any) => void;
  onOpenFilters: () => void;
}

const outcomeStyle: Record<string, { dot: string; badge: string; label: string }> = {
  allowed:   { dot: '#22c55e', badge: 'rgba(34,197,94,0.1)',  label: 'Allowed' },
  dismissed: { dot: '#ef4444', badge: 'rgba(239,68,68,0.1)',  label: 'Dismissed' },
  disposed:  { dot: '#f59e0b', badge: 'rgba(245,158,11,0.1)', label: 'Disposed' },
  set_aside: { dot: '#a855f7', badge: 'rgba(168,85,247,0.1)', label: 'Set Aside' },
  acquitted: { dot: '#3b82f6', badge: 'rgba(59,130,246,0.1)', label: 'Acquitted' },
  upheld:    { dot: '#10b981', badge: 'rgba(16,185,129,0.1)', label: 'Upheld' },
  unknown:   { dot: '#6b7280', badge: 'rgba(107,114,128,0.1)',label: 'Unknown' },
};

function getOutcomeStyle(outcome: string) {
  const key = Object.keys(outcomeStyle).find(k => outcome.toLowerCase().includes(k)) || 'unknown';
  return outcomeStyle[key];
}

function CaseNode({ c, index, isSelected, onToggleSelect }: { c: CaseCard; index: number; isSelected: boolean; onToggleSelect: () => void }) {
  const style = getOutcomeStyle(c.outcome);
  return (
    <div
      className="p-4 transition-all duration-200 group relative border border-gray-100 rounded-2xl hover:bg-gray-50"
      style={{ background: 'transparent' }}
    >
      {/* Checkbox */}
      <button 
        onClick={onToggleSelect}
        className={`absolute top-4 right-4 z-10 transition-colors ${isSelected ? 'text-[#D16F54]' : 'text-gray-300 hover:text-gray-400'}`}
      >
        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>

      {/* Case number + relevance */}
      <div className="flex items-start justify-between mb-3 pr-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-tags uppercase tracking-[1px] text-gray-400">Case {String(index + 1).padStart(2, '0')}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <p className="text-[14px] font-inter font-medium leading-snug line-clamp-2 text-[#333]" title={c.case_no}>{c.case_no}</p>
          {c.diary_no && c.diary_no !== 'Unknown' && (
            <p className="text-[10px] mt-1 uppercase tracking-[1px] font-tags line-clamp-1 text-gray-500" title={c.diary_no}>{c.diary_no}</p>
          )}
        </div>
        {/* Outcome badge */}
        <span
          className="shrink-0 ml-3 px-2 py-0.5 text-[10px] uppercase tracking-[1px] font-tags rounded-md"
          style={{ background: style.badge, color: style.dot, border: `1px solid ${style.dot}40` }}
        >
          {style.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-start gap-2 text-[10px] uppercase tracking-[1px] mb-3 font-tags text-gray-500">
        <Calendar size={10} className="mt-[2px] shrink-0" />
        <span className="shrink-0">{c.date}</span>
        <span className="shrink-0">|</span>
        <span className="line-clamp-2" title={c.bench}>{c.bench}</span>
      </div>

      {/* Excerpt */}
      <p className="font-inter text-[13px] leading-relaxed line-clamp-5 mb-3 text-gray-600">
        "{c.excerpt}"
      </p>

      {c.download_url ? (
        <a href={c.download_url.replace('uc?export=download&id=', 'file/d/') + '/view'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 uppercase tracking-[1px] text-[10px] transition-colors font-tags text-gray-500 hover:text-gray-900">
          Read PDF <ArrowUpRight size={10} />
        </a>
      ) : (
        <button className="inline-flex items-center gap-1.5 uppercase tracking-[1px] text-[10px] transition-colors font-tags text-gray-300 cursor-not-allowed">
          PDF Unavailable
        </button>
      )}
    </div>
  );
}

export default function RightPanel({ isOpen, onToggle, cases, filteredCases, filters, setFilters, onOpenFilters }: Props) {
  const outcomes = ['All', 'allowed', 'dismissed', 'disposed', 'set_aside', 'acquitted', 'upheld'];
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadSelected = async () => {
    const selected = filteredCases.filter(c => selectedIds.has(c.id) && c.download_url);
    if (selected.length === 0) return;
    
    if (selected.length === 1) {
      window.open(selected[0].download_url!, '_blank');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch('http://localhost:8000/api/download_zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: selected.map(c => c.download_url) })
      });

      if (!response.ok) throw new Error('Failed to download ZIP');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected_cases.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to generate ZIP file.');
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCases.map(c => c.id)));
    }
  };

  return (
    <>
      {/* Panel */}
      <div 
        className="h-full flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative flex-shrink-0"
        style={{ width: isOpen ? '280px' : '0px' }}
      >
        <div
          className="w-[280px] h-full flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 font-inter transition-opacity duration-300"
          style={{ opacity: isOpen ? 1 : 0 }}
        >
        {/* Header */}
        <div className="px-5 py-5 shrink-0 flex items-center justify-between" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] uppercase tracking-[1.4px] font-tags text-[#333]">Precedents</h2>
            {cases.length > 0 && (
              <span className="bg-[#D16F54] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {cases.length}
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-3 shrink-0" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <p className="text-[10px] uppercase tracking-[1px] mb-3 font-tags text-gray-500">
            {filteredCases.length} OF {cases.length} RESULTS
          </p>
          {cases.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {outcomeStyle && Object.entries(outcomeStyle).filter(([k]) => k !== 'unknown').map(([key, s]) => {
                const on = (filters.outcomes || []).includes(key);
                return (
                  <button key={key} onClick={() => setFilters((p: FilterState) => ({
                    ...p,
                    outcomes: on ? p.outcomes.filter(o => o !== key) : [...(p.outcomes || []), key],
                  }))}
                    className="px-1 py-1.5 text-[9px] uppercase tracking-[1px] transition-all font-tags text-center truncate"
                    style={{
                      background: on ? 'rgba(209,111,84,0.1)' : 'transparent',
                      color: on ? '#D16F54' : '#6b7280',
                      border: `1px solid ${on ? 'rgba(209,111,84,0.3)' : 'transparent'}`,
                      borderRadius: '8px'
                    }}
                    title={key.replace('_', ' ')}
                  >
                    {key.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          )}
          {cases.length > 0 && (
            <div className="flex items-center justify-between mt-3">
              <button onClick={onOpenFilters} className="flex items-center gap-2 uppercase tracking-[1px] text-[10px] transition-colors font-tags text-gray-500 hover:text-gray-900">
                <Filter size={12} /> Filter Settings
              </button>
              
              <button onClick={toggleSelectAll} className="uppercase tracking-[1px] text-[10px] transition-colors font-tags text-gray-500 hover:text-gray-900">
                {selectedIds.size === filteredCases.length && filteredCases.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        {/* Cases list */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 no-scrollbar">
          {cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Scale size={24} className="mb-4 text-gray-300" />
              <p className="uppercase tracking-[1px] text-[11px] font-tags text-gray-400">No Precedents Loaded</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="uppercase tracking-[1px] text-[11px] font-tags text-gray-400">No Matches</p>
              <button
                onClick={() => setFilters((p: any) => ({ ...p, outcomes: [] }))}
                className="mt-3 text-[10px] uppercase tracking-[1px] underline font-tags text-[#333]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredCases.map((c, i) => (
              <CaseNode 
                key={c.id} 
                c={c} 
                index={i} 
                isSelected={selectedIds.has(c.id)} 
                onToggleSelect={() => toggleSelect(c.id)} 
              />
            ))
          )}
        </div>

        {/* Footer Action (Download Selected) */}
        {selectedIds.size > 0 && (
          <div className="p-4" style={{ borderTop: '1px solid #f3f4f6', background: 'white' }}>
            <button
              onClick={handleDownloadSelected}
              disabled={isDownloading}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[1px] font-tags transition-all rounded-xl"
              style={{
                background: '#D16F54',
                color: 'white',
                opacity: isDownloading ? 0.5 : 1,
                cursor: isDownloading ? 'wait' : 'pointer'
              }}
              onMouseEnter={e => !isDownloading && ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
              onMouseLeave={e => !isDownloading && ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              <Download size={14} /> 
              {isDownloading ? 'CREATING ZIP...' : `Download Selected (${selectedIds.size})`}
            </button>
          </div>
        )}
      </div>


      </div>
    </>
  );
}
