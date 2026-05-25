import React from 'react';
import { ChevronLeft, BookOpen, Keyboard, Shield, HelpCircle, FileText, Sparkles, MessageSquare, Server } from 'lucide-react';

interface HelpPageProps {
  onClose: () => void;
}

export default function HelpPage({ onClose }: HelpPageProps) {
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
          <h1 className="text-2xl font-bold tracking-tight text-[#333]">Help & Documentation</h1>
          <p className="text-sm text-gray-500">Learn how to make the most out of Vora Legal.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Intro Section */}
          <section className="bg-[#FDF0E7]/40 rounded-[2rem] p-8 border border-orange-900/10">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <Sparkles className="w-8 h-8 text-[#D16F54]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#333] mb-3">Welcome to Vora Legal</h2>
                <p className="text-gray-600 leading-relaxed text-[15px]">
                  Vora Legal is an advanced AI assistant tailored specifically for Indian legal research. 
                  It is deeply integrated with a comprehensive case law database, enabling it to retrieve relevant citations, 
                  synthesize arguments, and parse complex judgments instantly. Use it to draft briefs, find precedents, or analyze legal concepts.
                </p>
              </div>
            </div>
          </section>

          {/* Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Quick Start */}
            <section className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-[#D16F54]/30 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-[#D16F54]" />
                <h3 className="text-xl font-bold text-[#333]">Quick Start Guide</h3>
              </div>
              <ul className="space-y-4 text-[14px] text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-[#333] shrink-0 mt-0.5">1</div>
                  <span>Start by typing a legal query (e.g., "What is the precedent for anticipatory bail in economic offences?").</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-[#333] shrink-0 mt-0.5">2</div>
                  <span>Vora will automatically search its embedded Supreme Court database if RAG (Retrieval-Augmented Generation) is enabled.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-[#333] shrink-0 mt-0.5">3</div>
                  <span>Review the cited cases in the right panel. Click on any case card to view the full judgment or its summary.</span>
                </li>
              </ul>
            </section>

            {/* Models & Settings */}
            <section className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-[#D16F54]/30 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <Server className="w-6 h-6 text-[#D16F54]" />
                <h3 className="text-xl font-bold text-[#333]">AI Models & Privacy</h3>
              </div>
              <div className="space-y-4 text-[14px] text-gray-600">
                <p>
                  Vora supports both cloud-based and local AI models to balance speed and privacy.
                </p>
                <div className="p-4 bg-white rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-[#333] mb-1">Gemini (Cloud)</h4>
                  <p className="text-xs">Fastest responses and highest reasoning capability. Requires a free Google AI Studio API key.</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-[#333] mb-1">Ollama (Local)</h4>
                  <p className="text-xs">Runs entirely on your machine. Zero data leaves your computer. Perfect for highly sensitive client data.</p>
                </div>
              </div>
            </section>

          </div>

          {/* Keyboard Shortcuts */}
          <section>
            <div className="flex items-center gap-3 mb-6 px-2">
              <Keyboard className="w-6 h-6 text-[#D16F54]" />
              <h3 className="text-xl font-bold text-[#333]">Keyboard Shortcuts</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                  <span className="text-[14px] font-medium text-gray-700">Send Message</span>
                  <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-500 shadow-sm">Enter</kbd>
                </div>
                <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                  <span className="text-[14px] font-medium text-gray-700">New Line in Chat</span>
                  <div className="flex gap-2">
                    <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-500 shadow-sm">Shift</kbd>
                    <span className="text-gray-400 text-sm mt-1">+</span>
                    <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-500 shadow-sm">Enter</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                  <span className="text-[14px] font-medium text-gray-700">Focus Chat Input</span>
                  <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-500 shadow-sm">/</kbd>
                </div>
                <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                  <span className="text-[14px] font-medium text-gray-700">Toggle Sidebar</span>
                  <div className="flex gap-2">
                    <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-500 shadow-sm">Ctrl</kbd>
                    <span className="text-gray-400 text-sm mt-1">+</span>
                    <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-500 shadow-sm">B</kbd>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section className="pb-10">
            <div className="flex items-center gap-3 mb-6 px-2">
              <HelpCircle className="w-6 h-6 text-[#D16F54]" />
              <h3 className="text-xl font-bold text-[#333]">Frequently Asked Questions</h3>
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <h4 className="font-bold text-[#333] mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#D16F54]" />
                  Is my data secure?
                </h4>
                <p className="text-[14px] text-gray-600 leading-relaxed">
                  Yes. If you use the local Ollama provider, no data ever leaves your computer. If you use Gemini, data is sent to Google's API. Ensure you do not submit highly sensitive PII if using cloud models.
                </p>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <h4 className="font-bold text-[#333] mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D16F54]" />
                  How up-to-date is the case law?
                </h4>
                <p className="text-[14px] text-gray-600 leading-relaxed">
                  The local database contains Supreme Court judgments curated up to the last index update. You can manually check for database updates or ask the model for its knowledge cutoff date.
                </p>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <h4 className="font-bold text-[#333] mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#D16F54]" />
                  Can I export my research?
                </h4>
                <p className="text-[14px] text-gray-600 leading-relaxed">
                  Yes, head to <strong>Settings &gt; Data & Privacy</strong> to download your current chat session as a text file for your records.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
