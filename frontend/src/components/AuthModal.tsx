import { useState } from 'react';
import { X, Settings2 } from 'lucide-react';

const DEFAULT_SYSTEM_PROMPT = `You are VORA — a senior Indian legal intelligence system with encyclopaedic knowledge of Indian constitutional law, statutory law, Supreme Court jurisprudence, High Court precedents, and legal doctrine spanning from 1950 to present day.

You think like a Supreme Court senior advocate with 30 years of practice: precise, opinionated, evidence-driven, and deeply aware of how the Indian judiciary actually behaves versus what the law says on paper.

CORE RULES:
1. Judge the query first — conversational, general legal, or case research.
2. Assess case relevance ruthlessly — ignore irrelevant retrieved cases entirely.
3. Reason deeply — pattern recognition, reasoning archaeology, constitutional anchoring, practical implications.
4. Cite precisely — Case Number + Year + Outcome always.
5. Be direct — never hedge excessively, take a position, fill gaps with expertise.`;

interface Props {
  show: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  provider: 'gemini' | 'ollama';
  setProvider: (p: 'gemini' | 'ollama') => void;
  ollamaModels: string[];
  selectedOllamaModel: string;
  setSelectedOllamaModel: (m: string) => void;
}

type Tab = 'gemini' | 'ollama' | 'system';

export default function AuthModal({
  show, onClose, apiKey, setApiKey, provider, setProvider,
  ollamaModels, selectedOllamaModel, setSelectedOllamaModel
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(provider === 'ollama' ? 'ollama' : 'gemini');
  const [systemPrompt, setSystemPrompt] = useState(
    () => localStorage.getItem('vora_system_prompt') || DEFAULT_SYSTEM_PROMPT
  );

  if (!show) return null;

  const handleSave = () => {
    localStorage.setItem('vora_system_prompt', systemPrompt);
    onClose();
  };

  const handleReset = () => setSystemPrompt(DEFAULT_SYSTEM_PROMPT);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#111318] text-white w-[520px] rounded-2xl shadow-2xl border border-[#2d3139] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-[#2d3139]">
          <div className="w-8 h-8 rounded-full bg-[#1a1d24] flex items-center justify-center">
            <Settings2 size={16} className="text-[#007bff]" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Model Settings</h2>
            <p className="text-xs text-gray-400">Configure AI models and system behaviour</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1a1d24] rounded-lg transition-colors text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 border-b border-[#2d3139]">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'gemini' ? 'border-[#007bff] text-[#007bff]' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            onClick={() => { setActiveTab('gemini'); setProvider('gemini'); }}
          >
            ✧ Gemini
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ollama' ? 'border-[#007bff] text-[#007bff]' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            onClick={() => { setActiveTab('ollama'); setProvider('ollama'); }}
          >
            ⊛ Ollama
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'system' ? 'border-[#007bff] text-[#007bff]' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('system')}
          >
            ⌘ System Prompt
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'gemini' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gemini API Key</label>
              <input
                type="password"
                className="w-full bg-[#1a1d24] border border-[#2d3139] rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-[#007bff] transition-colors"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">Get a free key at <a href="https://aistudio.google.com" target="_blank" className="text-[#007bff] hover:underline">aistudio.google.com</a>. Stored in localStorage — persists across sessions.</p>
              {apiKey && (
                <div className="flex items-center gap-2 mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-green-400">Key saved — active across refreshes</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ollama' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ollama Model</label>
              <select
                className="w-full bg-[#1a1d24] border border-[#2d3139] rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-[#007bff] transition-colors"
                value={selectedOllamaModel}
                onChange={e => setSelectedOllamaModel(e.target.value)}
              >
                {ollamaModels.length > 0 ? (
                  ollamaModels.map(m => <option key={m} value={m}>{m}</option>)
                ) : (
                  <option value="">No local models found — is Ollama running?</option>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Requires Ollama running locally. Also needed for ChromaDB embeddings.
                {ollamaModels.length === 0 && (
                  <span className="block mt-1 text-yellow-400">Run <code className="bg-black/30 px-1 rounded">ollama serve</code> to connect.</span>
                )}
              </p>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System Prompt</label>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#2d3139]"
                >
                  Reset to default
                </button>
              </div>
              <textarea
                className="w-full bg-[#1a1d24] border border-[#2d3139] rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-[#007bff] transition-colors resize-none font-mono leading-relaxed"
                rows={10}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
              />
              <p className="text-xs text-gray-500">Saved to localStorage. The backend uses its own hardcoded prompt — this will be synced to the backend in the next update.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#2d3139] flex justify-end gap-3 bg-[#1a1d24]/50">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-medium text-gray-300 border border-[#2d3139] hover:bg-[#2d3139] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl text-sm font-medium bg-[#007bff] text-white hover:bg-[#0056b3] transition-colors shadow-lg shadow-[#007bff]/20"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
