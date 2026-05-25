import React from 'react';
import { ChevronLeft, ShieldCheck, Database, Lock, EyeOff } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="h-full bg-white text-[#333] flex flex-col relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-900/5 rounded-[2rem] animate-fade-in font-sans">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-4 p-6 border-b border-orange-900/10 shrink-0">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#FDF0E7] text-[#D16F54] transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#333]">Privacy Policy</h1>
          <p className="text-sm text-gray-500">How Vora Legal handles and protects your data.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
          
          <div className="text-center space-y-4 mb-12">
            <div className="w-20 h-20 bg-[#FDF0E7] rounded-full flex items-center justify-center mx-auto text-[#D16F54]">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#333]">Your Privacy is Paramount</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              As a legal intelligence system, we understand that client confidentiality is non-negotiable. 
              Vora Legal is built from the ground up to respect attorney-client privilege and data sovereignty.
            </p>
          </div>

          <div className="space-y-8">
            <section className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <Database className="text-[#D16F54]" size={24} />
                <h3 className="text-xl font-bold text-[#333]">1. Data Collection & Storage</h3>
              </div>
              <div className="space-y-3 text-[15px] text-gray-600 leading-relaxed">
                <p>
                  <strong>Guest Mode:</strong> When using Vora Legal as a guest, your chat history and API keys are stored exclusively in your browser's local storage. We do not transmit this data to any central server. If you clear your browser data, your history is permanently deleted.
                </p>
                <p>
                  <strong>Authenticated Users:</strong> If you create an account, your chat metadata is securely synced to our encrypted Supabase database to allow cross-device access. You have the right to permanently delete this data at any time via the Settings panel.
                </p>
              </div>
            </section>

            <section className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="text-[#D16F54]" size={24} />
                <h3 className="text-xl font-bold text-[#333]">2. AI Models & Processing</h3>
              </div>
              <div className="space-y-3 text-[15px] text-gray-600 leading-relaxed">
                <p>
                  <strong>Local Models (Ollama):</strong> If you select Ollama as your AI provider, 100% of your prompts and documents are processed locally on your hardware. Absolutely zero data is transmitted over the internet.
                </p>
                <p>
                  <strong>Cloud Models (Gemini):</strong> If you opt to use Google's Gemini API for enhanced reasoning, your prompts are transmitted to Google's servers. Please ensure you redact Personally Identifiable Information (PII) or highly sensitive client data before submitting prompts to cloud models. We do not log or intercept your prompts en route.
                </p>
              </div>
            </section>

            <section className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <EyeOff className="text-[#D16F54]" size={24} />
                <h3 className="text-xl font-bold text-[#333]">3. Telemetry & Analytics</h3>
              </div>
              <div className="space-y-3 text-[15px] text-gray-600 leading-relaxed">
                <p>
                  Vora Legal does not track your specific legal queries. We only collect anonymized, aggregated telemetry regarding app performance and crash reports to improve the system's stability.
                </p>
              </div>
            </section>

            <section className="border-t border-gray-200 pt-8 mt-12">
              <h3 className="text-lg font-bold text-[#333] mb-3">Disclaimer</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                Vora Legal is an AI research tool and does not constitute formal legal advice. Always independently verify case citations and legal interpretations generated by the system before utilizing them in legal proceedings or client advisement.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
