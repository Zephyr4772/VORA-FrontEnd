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
      className="p-4 transition-all duration-200 group relative"
      style={{ background: 'transparent', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(128,128,128,0.05)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      {/* Checkbox */}
      <button 
        onClick={onToggleSelect}
        className="absolute top-4 right-4 z-10 transition-colors"
        style={{ color: isSelected ? 'var(--panel-text)' : 'var(--panel-text-muted)' }}
      >
        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>

      {/* Case number + relevance */}
      <div className="flex items-start justify-between mb-3 pr-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-tags uppercase tracking-[1px]" style={{ color: 'var(--panel-text-muted)' }}>Case {String(index + 1).padStart(2, '0')}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--panel-border)' }} />
          </div>
          <p className="text-[14px] font-inter font-medium leading-snug line-clamp-2" style={{ color: 'var(--panel-text)' }} title={c.case_no}>{c.case_no}</p>
          {c.diary_no && c.diary_no !== 'Unknown' && (
            <p className="text-[10px] mt-1 uppercase tracking-[1px] font-tags line-clamp-1" style={{ color: 'var(--panel-text-muted)' }} title={c.diary_no}>{c.diary_no}</p>
          )}
        </div>
        {/* Outcome badge */}
        <span
          className="shrink-0 ml-3 px-2 py-0.5 text-[10px] uppercase tracking-[1px] font-tags"
          style={{ background: style.badge, color: style.dot, border: `1px solid ${style.dot}40`, borderRadius: 'var(--radius-sm)' }}
        >
          {style.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-start gap-2 text-[10px] uppercase tracking-[1px] mb-3 font-tags" style={{ color: 'var(--panel-text-muted)' }}>
        <Calendar size={10} className="mt-[2px] shrink-0" />
        <span className="shrink-0">{c.date}</span>
        <span className="shrink-0">|</span>
        <span className="line-clamp-2" title={c.bench}>{c.bench}</span>
      </div>

      {/* Excerpt */}
      <p className="font-inter text-[13px] leading-relaxed line-clamp-5 mb-3" style={{ color: 'var(--panel-text-muted)' }}>
        "{c.excerpt}"
      </p>

      {c.download_url ? (
        <a href={c.download_url.replace('uc?export=download&id=', 'file/d/') + '/view'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 uppercase tracking-[1px] text-[10px] transition-colors font-tags"
          style={{ color: 'var(--panel-text-muted)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text-muted)'}
        >
          Read PDF <ArrowUpRight size={10} />
        </a>
      ) : (
        <button className="inline-flex items-center gap-1.5 uppercase tracking-[1px] text-[10px] transition-colors font-tags"
          style={{ color: 'var(--panel-text-muted)', opacity: 0.5, cursor: 'not-allowed' }}
        >
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
      {/* Toggle Tab */}
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 py-4 px-2 transition-all"
        style={{
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
          borderRight: 'none',
          borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
          right: isOpen ? '320px' : '0px',
          transition: 'right 0.35s ease',
          boxShadow: 'var(--shadow-sm)',
        }}
        title={isOpen ? 'Close Vault' : 'Open Vault'}
      >
        <Scale size={14} style={{ color: 'var(--panel-text)' }} />
        <ChevronRight
          size={12}
          style={{ color: 'var(--panel-text-muted)', transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}
        />
      </button>

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-20 flex flex-col transition-transform duration-350 ease-in-out font-inter"
        style={{
          width: '320px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          background: 'var(--panel-bg)',
          borderLeft: '1px solid var(--panel-border)',
        }}
      >
        {/* Header */}
        <div className="px-5 py-5 shrink-0 flex items-center justify-between" style={{ borderBottom: '1px solid var(--panel-border)' }}>
          <h2 className="text-[14px] uppercase tracking-[1.4px] font-tags" style={{ color: 'var(--panel-text)' }}>Precedents</h2>
          <button
            onClick={onToggle}
            className="transition-colors"
            style={{ color: 'var(--panel-text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text-muted)'}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 shrink-0" style={{ borderBottom: '1px solid var(--panel-border)' }}>
          <p className="text-[10px] uppercase tracking-[1px] mb-3 font-tags" style={{ color: 'var(--panel-text-muted)' }}>
            {filteredCases.length} OF {cases.length} RESULTS
          </p>
          {cases.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {outcomeStyle && Object.entries(outcomeStyle).filter(([k]) => k !== 'unknown').map(([key, s]) => {
                const on = (filters.outcomes || []).includes(key);
                return (
                  <button key={key} onClick={() => setFilters((p: FilterState) => ({
                    ...p,
                    outcomes: on ? p.outcomes.filter(o => o !== key) : [...(p.outcomes || []), key],
                  }))}
                    className="px-2 py-1 text-[10px] uppercase tracking-[1px] transition-all font-tags"
                    style={{
                      background: on ? 'rgba(128,128,128,0.1)' : 'transparent',
                      color: on ? 'var(--panel-text)' : 'var(--panel-text-muted)',
                      border: `1px solid ${on ? 'var(--panel-border)' : 'transparent'}`,
                      borderRadius: 'var(--radius-sm)'
                    }}>
                    {key.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          )}
          {cases.length > 0 && (
            <div className="flex items-center justify-between mt-3">
              <button onClick={onOpenFilters} className="flex items-center gap-2 uppercase tracking-[1px] text-[10px] transition-colors font-tags"
                style={{ color: 'var(--panel-text-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text-muted)'}
              >
                <Filter size={12} /> Filter Settings
              </button>
              
              <button onClick={toggleSelectAll} className="uppercase tracking-[1px] text-[10px] transition-colors font-tags"
                style={{ color: 'var(--panel-text-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text-muted)'}
              >
                {selectedIds.size === filteredCases.length && filteredCases.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        {/* Cases list */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 no-scrollbar">
          {cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Scale size={24} className="mb-4" style={{ color: 'var(--panel-text-muted)', opacity: 0.5 }} />
              <p className="uppercase tracking-[1px] text-[11px] font-tags" style={{ color: 'var(--panel-text-muted)' }}>No Precedents Loaded</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="uppercase tracking-[1px] text-[11px] font-tags" style={{ color: 'var(--panel-text-muted)' }}>No Matches</p>
              <button
                onClick={() => setFilters((p: any) => ({ ...p, outcomes: [] }))}
                className="mt-3 text-[10px] uppercase tracking-[1px] underline font-tags"
                style={{ color: 'var(--panel-text)' }}
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
          <div className="p-4" style={{ borderTop: '1px solid var(--panel-border)', background: 'var(--panel-bg)' }}>
            <button
              onClick={handleDownloadSelected}
              disabled={isDownloading}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[1px] font-tags transition-all"
              style={{
                background: 'var(--panel-text)',
                color: 'var(--panel-bg)',
                borderRadius: 'var(--radius-sm)',
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
    </>
  );
}
