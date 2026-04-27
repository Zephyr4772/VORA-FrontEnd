import { useState, useRef, useEffect } from 'react';
import { Filter, X, Check, Search } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
export interface FilterState {
  outcomes: string[];
  yearRange: [number, number];
  bench_includes: string;
  author_judge: string;
  sections: string[];
  articles: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  outcomes: [],
  yearRange: [1950, new Date().getFullYear()],
  bench_includes: '',
  author_judge: '',
  sections: [],
  articles: [],
};

interface CaseData {
  id: number; case_no: string; bench: string; date: string;
  outcome: string; diary_no: string; excerpt: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  cases: CaseData[]; // retrieved cases for dynamic options
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ALL_OUTCOMES = [
  { key: 'allowed',   label: 'Allowed',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.30)' },
  { key: 'dismissed', label: 'Dismissed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.30)' },
  { key: 'disposed',  label: 'Disposed',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.30)' },
  { key: 'set_aside', label: 'Set Aside', color: '#a855f7', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.30)' },
  { key: 'acquitted', label: 'Acquitted', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.30)' },
  { key: 'upheld',    label: 'Upheld',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.30)' },
];

const KNOWN_JUDGES = [
  'D.Y. CHANDRACHUD','N.V. RAMANA','U.U. LALIT','S.A. BOBDE','RANJAN GOGOI',
  'DIPAK MISRA','T.S. THAKUR','H.L. DATTU','R.M. LODHA','P. SATHASIVAM',
  'ALTAMAS KABIR','S.H. KAPADIA','K.G. BALAKRISHNAN','SANJIV KHANNA',
  'B.R. GAVAI','SURYA KANT','HIMA KOHLI','A.S. BOPANNA','V. RAMASUBRAMANIAN',
  'M.M. SUNDRESH','BELA M. TRIVEDI','J.B. PARDIWALA','PANKAJ MITHAL',
  'SANJAY KUMAR','A.G. MASIH','PRASHANT KUMAR MISHRA','K.V. VISWANATHAN',
];

const COMMON_SECTIONS = [
  '302','304','307','376','420','498A','138','34','120B','406','506',
  '153A','124A','2','3','4','5','7','10','11','13','17','19','21','22',
];

const COMMON_ARTICLES = ['14','19','21','21A','25','32','136','141','142','226','227','300A'];

const THIS_YEAR = new Date().getFullYear();

// ── Helpers ────────────────────────────────────────────────────────────────────
function extractYear(date: string): number | null {
  const m = date.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0]) : null;
}

function extractBenches(cases: CaseData[]): string[] {
  const s = new Set<string>();
  cases.forEach(c => c.bench.split(',').forEach(b => { const t = b.trim(); if (t) s.add(t); }));
  return Array.from(s).sort();
}

function extractAuthors(cases: CaseData[]): string[] {
  const s = new Set<string>();
  cases.forEach(c => {
    c.bench.split(',').forEach(b => {
      const clean = b.trim().replace(/^(HONBLE|HON\.?|MR\.?|JUSTICE\.?)\s*/i, '').trim();
      if (clean.length > 3) s.add(clean);
    });
  });
  return Array.from(s).sort();
}

function extractYearBounds(cases: CaseData[]): [number, number] {
  const years = cases.map(c => extractYear(c.date)).filter(Boolean) as number[];
  if (!years.length) return [1950, THIS_YEAR];
  return [Math.min(...years), Math.max(...years)];
}

function extractOutcomes(cases: CaseData[]): string[] {
  const s = new Set<string>();
  cases.forEach(c => {
    const key = ALL_OUTCOMES.find(o => c.outcome.toLowerCase().includes(o.key));
    if (key) s.add(key.key);
  });
  return Array.from(s);
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[1.4px] mb-2 font-tags" style={{ color: 'var(--panel-text-muted)' }}>{children}</p>;
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--panel-border)' }} />;
}

function AutocompleteInput({
  value, onChange, placeholder, options, label
}: {
  value: string; onChange: (v: string) => void;
  placeholder: string; options: string[]; label: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQ(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  return (
    <div ref={ref} className="relative">
      <SectionLabel>{label}</SectionLabel>
      <div className="relative">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--panel-text-muted)' }} />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
          placeholder={placeholder}
          className="font-inter transition-colors"
          style={{
            width: '100%', background: 'transparent',
            border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)',
            padding: '8px 10px 8px 30px', fontSize: '13px',
            color: 'var(--panel-text)', outline: 'none',
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--panel-text-muted)'; setOpen(true); }}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--panel-border)'}
        />
        {q && (
          <button onClick={() => { setQ(''); onChange(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--panel-text-muted)' }}>
            <X size={12} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden"
          style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)' }}
        >
          {filtered.map(opt => (
            <button
              key={opt}
              className="w-full text-left px-3 py-2 text-[12px] uppercase tracking-[1px] transition-colors font-tags"
              style={{ color: 'var(--panel-text)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(128,128,128,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              onMouseDown={e => { e.preventDefault(); setQ(opt); onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TagInput({ tags, onChange, suggestions, label, placeholder }: {
  tags: string[]; onChange: (t: string[]) => void;
  suggestions: string[]; label: string; placeholder: string;
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const add = (v: string) => {
    const clean = v.trim().replace(/,/g, '').toUpperCase();
    if (clean && !tags.includes(clean)) onChange([...tags, clean]);
    setInput(''); setOpen(false);
  };

  const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)).slice(0, 6);

  return (
    <div ref={ref}>
      <SectionLabel>{label}</SectionLabel>
      {/* Existing tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-[1px] font-tags"
              style={{ background: 'transparent', color: 'var(--panel-text)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)' }}>
              {t}
              <button onClick={() => onChange(tags.filter(x => x !== t))} className="opacity-50 hover:opacity-100">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Input */}
      <div className="relative">
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); add(input); }
            if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1));
          }}
          placeholder={placeholder}
          className="font-inter transition-colors"
          style={{
            width: '100%', background: 'transparent',
            border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)',
            padding: '8px 10px', fontSize: '13px',
            color: 'var(--panel-text)', outline: 'none',
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--panel-text-muted)'; setOpen(true); }}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--panel-border)'}
        />
        {input && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[1px] px-2 py-1 font-tags"
            style={{ background: 'var(--panel-text)', color: 'var(--panel-bg)', borderRadius: 'var(--radius-sm)' }}
            onMouseDown={e => { e.preventDefault(); add(input); }}>
            ADD
          </button>
        )}
      </div>
      {/* Suggestions */}
      {open && (filtered.length > 0 || suggestions.length > 0) && (
        <div className="mt-1 overflow-hidden" style={{ border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', borderRadius: 'var(--radius-sm)' }}>
          {(input ? filtered : suggestions.filter(s => !tags.includes(s)).slice(0, 8)).map(s => (
            <button key={s} className="w-full text-left px-3 py-2 text-[12px] transition-colors flex items-center gap-2 font-tags"
              style={{ color: 'var(--panel-text-muted)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(128,128,128,0.1)'; (e.currentTarget as HTMLElement).style.color = 'var(--panel-text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--panel-text-muted)'; }}
              onMouseDown={e => { e.preventDefault(); add(s); }}>
              <span className="font-bold uppercase tracking-[1px]" style={{ color: 'var(--panel-text)' }}>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function YearRange({ range, onChange, min, max }: {
  range: [number, number]; onChange: (r: [number, number]) => void; min: number; max: number;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const handleFrom = (raw: number) => {
    const v = clamp(raw, min, range[1] - 1);
    onChange([v, range[1]]);
  };
  const handleTo = (raw: number) => {
    const v = clamp(raw, range[0] + 1, max);
    onChange([range[0], v]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Year range</SectionLabel>
        <span className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-[1px] font-tags"
          style={{ background: 'transparent', color: 'var(--panel-text)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)' }}>
          {range[0]} – {range[1]}
        </span>
      </div>

      {/* Dual-thumb slider */}
      <div className="relative mb-6 px-1" style={{ height: '20px' }}>
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-px"
          style={{ background: 'var(--panel-border)' }} />
        {/* Active fill */}
        <div className="absolute top-1/2 -translate-y-1/2 h-px"
          style={{ background: 'var(--panel-text)', left: `${pct(range[0])}%`, right: `${100 - pct(range[1])}%` }} />

        {/* FROM thumb */}
        <input
          type="range" min={min} max={max} step={1} value={range[0]}
          onChange={e => handleFrom(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: range[0] > max - 10 ? 5 : 3 }}
        />
        {/* TO thumb */}
        <input
          type="range" min={min} max={max} step={1} value={range[1]}
          onChange={e => handleTo(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
        />

        {/* Visual thumb FROM */}
        <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `calc(${pct(range[0])}% - 6px)` }}>
          <div className="w-3 h-3" style={{ background: 'var(--panel-text)', borderRadius: '50%' }} />
        </div>
        {/* Visual thumb TO */}
        <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `calc(${pct(range[1])}% - 6px)` }}>
          <div className="w-3 h-3" style={{ background: 'var(--panel-text)', borderRadius: '50%' }} />
        </div>
      </div>

      {/* Numeric inputs for precise entry */}
      <div className="grid grid-cols-2 gap-3">
        {([['From', range[0], handleFrom, min, range[1] - 1], ['To', range[1], handleTo, range[0] + 1, max]] as const).map(
          ([label, val, handler, lo, hi]) => (
            <div key={String(label)}>
              <p className="text-[10px] uppercase tracking-[1px] mb-1.5 font-tags" style={{ color: 'var(--panel-text-muted)' }}>{label}</p>
              <input
                type="number" min={lo} max={hi} value={val}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v)) handler(v);
                }}
                className="font-inter"
                style={{
                  width: '100%', background: 'transparent',
                  border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px', fontSize: '13px',
                  color: 'var(--panel-text)', outline: 'none',
                  textAlign: 'center', MozAppearance: 'textfield',
                } as React.CSSProperties}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--panel-text-muted)'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--panel-border)'}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}


// ── Main FilterPanel ───────────────────────────────────────────────────────────
export default function FilterPanel({ show, onClose, filters, setFilters, cases }: Props) {
  const [local, setLocal] = useState<FilterState>(filters);
  useEffect(() => { setLocal(filters); }, [filters]);
  if (!show) return null;

  const hasCases = cases.length > 0;

  // Dynamic options from retrieved cases
  const dynBenches   = hasCases ? extractBenches(cases)  : KNOWN_JUDGES;
  const dynAuthors   = hasCases ? extractAuthors(cases)  : KNOWN_JUDGES;
  const dynOutcomes  = hasCases ? extractOutcomes(cases) : ALL_OUTCOMES.map(o => o.key);
  const [dynMinYear, dynMaxYear] = hasCases ? extractYearBounds(cases) : [1950, THIS_YEAR];

  const availableOutcomes = ALL_OUTCOMES.filter(o => !hasCases || dynOutcomes.includes(o.key));

  const toggleOutcome = (key: string) => {
    setLocal(p => ({
      ...p,
      outcomes: p.outcomes.includes(key) ? p.outcomes.filter(o => o !== key) : [...p.outcomes, key],
    }));
  };

  const activeCount = [
    local.outcomes.length > 0,
    local.yearRange[0] !== dynMinYear || local.yearRange[1] !== dynMaxYear,
    !!local.bench_includes,
    !!local.author_judge,
    local.sections.length > 0,
    local.articles.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[80] flex" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-[2px]" />
      <div
        className="h-full flex flex-col font-inter"
        style={{ width: '380px', background: 'var(--panel-bg)', borderLeft: '1px solid var(--panel-border)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0" style={{ borderBottom: '1px solid var(--panel-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center border"
              style={{ background: 'transparent', borderColor: 'var(--panel-border)', borderRadius: 'var(--radius-sm)' }}>
              <Filter size={14} style={{ color: 'var(--panel-text)' }} />
            </div>
            <div>
              <p className="text-[13px] uppercase tracking-[1.4px] font-tags" style={{ color: 'var(--panel-text)' }}>Filters</p>
              <p className="text-[10px] uppercase tracking-[1px] mt-0.5 font-tags" style={{ color: hasCases ? 'var(--panel-text)' : 'var(--panel-text-muted)' }}>
                {hasCases ? `OPTIONS FROM ${cases.length} CASES` : 'PRE-QUERY · ALL OPTIONS'}
                {activeCount > 0 && ` · ${activeCount} ACTIVE`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 transition-colors" style={{ color: 'var(--panel-text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text-muted)'}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 no-scrollbar">

          {/* ── Outcomes (multi) ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Outcomes</SectionLabel>
              {local.outcomes.length > 0 && (
                <button onClick={() => setLocal(p => ({ ...p, outcomes: [] }))}
                  className="text-[10px] uppercase tracking-[1px] transition-colors font-tags" style={{ color: 'var(--panel-text-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--panel-text-muted)'}>
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableOutcomes.map(o => {
                const on = local.outcomes.includes(o.key);
                return (
                  <button key={o.key} onClick={() => toggleOutcome(o.key)}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[1px] transition-all font-tags"
                    style={{
                      background: on ? 'rgba(128,128,128,0.1)' : 'transparent',
                      border: `1px solid ${on ? 'var(--panel-border)' : 'transparent'}`,
                      color: on ? 'var(--panel-text)' : 'var(--panel-text-muted)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                    {on ? <Check size={12} /> : <span className="w-3 h-3 border" style={{ borderColor: 'var(--panel-border)', borderRadius: 'var(--radius-sm)' }} />}
                    {o.label}
                  </button>
                );
              })}
            </div>
            {local.outcomes.length === 0 && (
              <p className="text-[10px] uppercase tracking-[1px] mt-2 font-tags" style={{ color: 'var(--panel-text-muted)' }}>NONE SELECTED = ALL OUTCOMES</p>
            )}
          </div>

          <Divider />

          {/* ── Year Range ── */}
          <YearRange
            range={local.yearRange}
            onChange={r => setLocal(p => ({ ...p, yearRange: r }))}
            min={dynMinYear} max={dynMaxYear}
          />

          <Divider />

          {/* ── Bench Autocomplete ── */}
          <AutocompleteInput
            value={local.bench_includes}
            onChange={v => setLocal(p => ({ ...p, bench_includes: v }))}
            options={dynBenches}
            placeholder={hasCases ? 'From retrieved cases…' : 'e.g. CHANDRACHUD…'}
            label={hasCases ? 'Bench (from retrieved)' : 'Bench includes'}
          />

          {/* ── Author Autocomplete ── */}
          <AutocompleteInput
            value={local.author_judge}
            onChange={v => setLocal(p => ({ ...p, author_judge: v }))}
            options={dynAuthors}
            placeholder={hasCases ? 'From retrieved cases…' : 'e.g. BHAT…'}
            label={hasCases ? 'Author judge (from retrieved)' : 'Author judge'}
          />

          <Divider />

          {/* ── IPC Sections (tags) ── */}
          <TagInput
            tags={local.sections}
            onChange={t => setLocal(p => ({ ...p, sections: t }))}
            suggestions={COMMON_SECTIONS}
            label="IPC / Statute sections"
            placeholder="Type section, press Enter…"
          />

          {/* ── Constitutional Articles (tags) ── */}
          <TagInput
            tags={local.articles}
            onChange={t => setLocal(p => ({ ...p, articles: t }))}
            suggestions={COMMON_ARTICLES}
            label="Constitutional articles"
            placeholder="e.g. 21, 14…"
          />

          {/* ── Active summary ── */}
          {activeCount > 0 && (
            <div className="p-4" style={{ background: 'rgba(128,128,128,0.02)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-md)' }}>
              <p className="text-[10px] font-bold uppercase tracking-[1px] mb-3 font-tags" style={{ color: 'var(--panel-text-muted)' }}>Active filters</p>
              <div className="flex flex-wrap gap-2">
                {local.outcomes.map(o => <Chip key={o} label={`Outcome: ${o}`} />)}
                {(local.yearRange[0] !== dynMinYear || local.yearRange[1] !== dynMaxYear) &&
                  <Chip label={`${local.yearRange[0]}–${local.yearRange[1]}`} />}
                {local.bench_includes && <Chip label={`Bench: ${local.bench_includes}`} />}
                {local.author_judge && <Chip label={`Author: ${local.author_judge}`} />}
                {local.sections.map(s => <Chip key={s} label={`§ ${s}`} />)}
                {local.articles.map(a => <Chip key={a} label={`Art. ${a}`} />)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex gap-3 shrink-0" style={{ borderTop: '1px solid var(--panel-border)' }}>
          <button onClick={() => setLocal({ ...DEFAULT_FILTERS, yearRange: [dynMinYear, dynMaxYear] })}
            className="flex-1 py-3 text-[11px] uppercase tracking-[1.4px] transition-all font-tags"
            style={{ color: 'var(--panel-text-muted)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--panel-text-muted)'; (e.currentTarget as HTMLElement).style.color = 'var(--panel-text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--panel-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--panel-text-muted)'; }}>
            Clear
          </button>
          <button onClick={() => { setFilters(local); onClose(); }}
            className="flex-[2] py-3 text-[11px] uppercase tracking-[1.4px] transition-all font-tags hover:opacity-90"
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-bg)', color: 'var(--accent-text)', boxShadow: 'var(--shadow-accent)' }}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 text-[10px] uppercase tracking-[1px] font-tags"
      style={{ background: 'transparent', color: 'var(--panel-text)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)' }}>
      {label}
    </span>
  );
}
