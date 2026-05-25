import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, ChevronDown, ArrowUp, X, FileText, Loader2, Check, Archive, Clock, SlidersHorizontal } from "lucide-react";

/* --- ICONS --- */
export const Icons = {
    Logo: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="presentation" {...props}>
            <defs>
                <ellipse id="petal-pair" cx="100" cy="100" rx="90" ry="22" />
            </defs>
            <g fill="#D46B4F" fillRule="evenodd">
                <use href="#petal-pair" transform="rotate(0 100 100)" />
                <use href="#petal-pair" transform="rotate(45 100 100)" />
                <use href="#petal-pair" transform="rotate(90 100 100)" />
                <use href="#petal-pair" transform="rotate(135 100 100)" />
            </g>
        </svg>
    ),
    // Using Lucide React for premium, consistent icons
    Plus: Plus,
    Thinking: (props: React.SVGProps<SVGSVGElement>) => <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M10.3857 2.50977C14.3486 2.71054 17.5 5.98724 17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 9.72386 2.72386 9.5 3 9.5C3.27614 9.5 3.5 9.72386 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.5225 13.7691 3.68312 10.335 3.50879L10 3.5L9.89941 3.49023C9.67145 3.44371 9.5 3.24171 9.5 3C9.5 2.72386 9.72386 2.5 10 2.5L10.3857 2.50977ZM10 5.5C10.2761 5.5 10.5 5.72386 10.5 6V9.69043L13.2236 11.0527C13.4706 11.1762 13.5708 11.4766 13.4473 11.7236C13.3392 11.9397 13.0957 12.0435 12.8711 11.9834L12.7764 11.9473L9.77637 10.4473C9.60698 10.3626 9.5 10.1894 9.5 10V6C9.5 5.72386 9.72386 5.5 10 5.5ZM3.66211 6.94141C4.0273 6.94159 4.32303 7.23735 4.32324 7.60254C4.32324 7.96791 4.02743 8.26446 3.66211 8.26465C3.29663 8.26465 3 7.96802 3 7.60254C3.00021 7.23723 3.29676 6.94141 3.66211 6.94141ZM4.95605 4.29395C5.32146 4.29404 5.61719 4.59063 5.61719 4.95605C5.6171 5.3214 5.3214 5.61709 4.95605 5.61719C4.59063 5.61719 4.29403 5.32146 4.29395 4.95605C4.29395 4.59057 4.59057 4.29395 4.95605 4.29395ZM7.60254 3C7.96802 3 8.26465 3.29663 8.26465 3.66211C8.26446 4.02743 7.96791 4.32324 7.60254 4.32324C7.23736 4.32302 6.94159 4.0273 6.94141 3.66211C6.94141 3.29676 7.23724 3.00022 7.60254 3Z"></path></svg>,
    SelectArrow: ChevronDown,
    ArrowUp: ArrowUp,
    X: X,
    FileText: FileText,
    Loader2: Loader2,
    Check: Check,
    Archive: Archive,
    Clock: Clock,
    Filter: SlidersHorizontal,
};

/* --- UTILS --- */
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/* --- COMPONENTS --- */

// 1. File Preview Card
interface AttachedFile {
    id: string;
    file: File;
    type: string;
    preview: string | null;
    uploadStatus: string;
    content?: string;
}

interface FilePreviewCardProps {
    file: AttachedFile;
    onRemove: (id: string) => void;
}

const FilePreviewCard: React.FC<FilePreviewCardProps> = ({ file, onRemove }) => {
    const isImage = file.type.startsWith("image/") && file.preview;

    return (
        <div className={`relative group flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-bg-300 bg-bg-200 animate-fade-in transition-all hover:border-text-400`}>
            {isImage ? (
                <div className="w-full h-full relative">
                    <img src={file.preview!} alt={file.file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                </div>
            ) : (
                <div className="w-full h-full p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-bg-300 rounded">
                            <Icons.FileText className="w-4 h-4 text-text-300" />
                        </div>
                        <span className="text-[10px] font-medium text-text-400 uppercase tracking-wider truncate">
                            {file.file.name.split('.').pop()}
                        </span>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs font-medium text-text-200 truncate" title={file.file.name}>
                            {file.file.name}
                        </p>
                        <p className="text-[10px] text-text-500">
                            {formatFileSize(file.file.size)}
                        </p>
                    </div>
                </div>
            )}

            {/* Remove Button Overlay */}
            <button
                onClick={() => onRemove(file.id)}
                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Icons.X className="w-3 h-3" />
            </button>

            {/* Upload Status */}
            {file.uploadStatus === 'uploading' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Icons.Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
            )}
        </div>
    );
};

// 2. Pasted Content Card
interface PastedContentCardProps {
    content: {
        id: string;
        content: string;
        timestamp: Date;
    };
    onRemove: (id: string) => void;
}

const PastedContentCard: React.FC<PastedContentCardProps> = ({ content, onRemove }) => {
    return (
        <div className="relative group flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#30302E] bg-white dark:bg-[#20201F] animate-fade-in p-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="overflow-hidden w-full">
                <p className="text-[10px] text-[#9CA3AF] leading-[1.4] font-mono break-words whitespace-pre-wrap line-clamp-4 select-none">
                    {content.content}
                </p>
            </div>

            <div className="flex items-center justify-between w-full mt-2">
                <div className="inline-flex items-center justify-center px-1.5 py-[2px] rounded border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-transparent">
                    <span className="text-[9px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider font-sans">PASTED</span>
                </div>
            </div>

            <button
                onClick={() => onRemove(content.id)}
                className="absolute top-2 right-2 p-[3px] bg-white dark:bg-[#30302E] border border-[#E5E5E5] dark:border-[#404040] rounded-full text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
            >
                <Icons.X className="w-2 h-2" />
            </button>
        </div>
    );
};

// 3. Model Selector
interface Model {
    id: string;
    name: string;
    description: string;
    badge?: string;
}

interface ModelSelectorProps {
    models: Model[];
    selectedModel: string;
    onSelect: (modelId: string) => void;
    dropUp?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onSelect, dropUp = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentModel = models.find(m => m.id === selectedModel) || models[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const cloudModels = models.filter(m => m.badge !== 'Local');
    const localModels = models.filter(m => m.badge === 'Local');

    const renderModelBtn = (model: Model) => (
        <button
            key={model.id}
            onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start justify-between group transition-colors hover:bg-gray-50`}
        >
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-gray-800">
                        {model.name}
                    </span>
                    {model.badge && (
                        <span className={`px-1.5 py-[1px] rounded-full text-[10px] font-medium border ${model.badge === 'Upgrade'
                            ? 'border-blue-200 text-blue-600 bg-white'
                            : 'border-gray-200 text-gray-500'
                            }`}>
                            {model.badge}
                        </span>
                    )}
                </div>
                <span className="text-[11px] text-gray-500">
                    {model.description}
                </span>
            </div>
            {selectedModel === model.id && (
                <Icons.Check className="w-4 h-4 text-[#D16F54] mt-1" />
            )}
        </button>
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center justify-center relative shrink-0 transition font-base duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] h-8 rounded-xl px-3 min-w-[4rem] active:scale-[0.98] whitespace-nowrap !text-xs pl-2.5 pr-2 gap-1 
                ${isOpen
                        ? 'bg-gray-100 text-gray-800'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            >
                <div className="font-ui inline-flex gap-[3px] text-[14px] h-[14px] leading-none items-baseline">
                    <div className="flex items-center gap-[4px]">
                        <div className="whitespace-nowrap select-none font-medium">{currentModel.name}</div>
                    </div>
                </div>
                <div className="flex items-center justify-center opacity-75" style={{ width: '20px', height: '20px' }}>
                    <Icons.SelectArrow className={`shrink-0 opacity-75 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className={`absolute ${dropUp ? 'bottom-full origin-bottom-right mb-2' : 'top-full origin-top-right mt-2'} right-0 w-[260px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col p-1.5 animate-fade-in`}>
                    <div className="max-h-[280px] overflow-y-auto custom-scrollbar flex flex-col pr-1">
                        {cloudModels.length > 0 && (
                            <div className="flex flex-col">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cloud Models</div>
                                {cloudModels.map(renderModelBtn)}
                            </div>
                        )}
                        {localModels.length > 0 && (
                            <div className="flex flex-col mt-1">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Local Models</div>
                                {localModels.map(renderModelBtn)}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-gray-100 my-1 mx-2 shrink-0" />

                    <button onClick={() => window.open("https://ollama.com/library", "_blank")} className="w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between group transition-colors hover:bg-gray-50 text-gray-800 shrink-0">
                        <span className="text-[13px] font-semibold">More models</span>
                        <Icons.SelectArrow className="w-4 h-4 -rotate-90 text-gray-400" />
                    </button>
                </div>
            )}
        </div>
    );
};

// 4. Main Chat Input Component
interface ClaudeChatInputProps {
    onSendMessage: (data: {
        message: string;
        files: AttachedFile[];
        pastedContent: AttachedFile[];
        model: string;
        isThinkingEnabled: boolean;
        numCases: number;
    }) => void;
    hasMessages?: boolean;
    onOpenFilters?: () => void;
    isRagEnabled?: boolean;
    onToggleRag?: () => void;
}

export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({ onSendMessage, hasMessages = false, onOpenFilters, isRagEnabled = true, onToggleRag }) => {
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<AttachedFile[]>([]);
    const [pastedContent, setPastedContent] = useState<AttachedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
    const [numCases, setNumCases] = useState(5);
    const [isNumCasesOpen, setIsNumCasesOpen] = useState(false);
    const [models, setModels] = useState<Model[]>([
        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Fastest API model", badge: "Cloud" },
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Most capable API model", badge: "Cloud" }
    ]);
    const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Ollama models
    useEffect(() => {
        fetch('/api/models', { headers: { 'ngrok-skip-browser-warning': 'true' } })
            .then(res => {
                if (!res.ok) throw new Error(`Backend returned ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data.models && data.models.length > 0) {
                    const localModels = data.models.map((m: any) => ({
                        id: m.name,
                        name: m.name,
                        description: "Local Ollama Model",
                        badge: "Local"
                    }));
                    setModels(prev => {
                        // avoid duplicates
                        const newModels = [...prev];
                        localModels.forEach((lm: any) => {
                            if (!newModels.find(m => m.id === lm.id)) newModels.push(lm);
                        });
                        return newModels;
                    });
                }
            })
            .catch(err => console.error(err));
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 384) + "px"; // 96 * 4 = 384px (max-h-96)
        }
    }, [message]);

    // File Handling
    const handleFiles = useCallback((newFilesList: FileList | File[]) => {
        const newFiles = Array.from(newFilesList).map(file => {
            const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
            return {
                id: Math.random().toString(36).substr(2, 9),
                file,
                type: isImage ? 'image/unknown' : (file.type || 'application/octet-stream'), // Force image type if detected by extension
                preview: isImage ? URL.createObjectURL(file) : null,
                uploadStatus: 'pending'
            };
        });

        // Simulate Upload
        setFiles(prev => [...prev, ...newFiles]);

        // Dynamic Feedback Message
        setMessage(prev => {
            if (prev) return prev;
            if (newFiles.length === 1) {
                const f = newFiles[0];
                if (f.type.startsWith('image/')) return "Analyzed image...";
                return "Analyzed document...";
            }
            return `Analyzed ${newFiles.length} files...`;
        });

        newFiles.forEach(f => {
            setTimeout(() => {
                setFiles(prev => prev.map(p => p.id === f.id ? { ...p, uploadStatus: 'complete' } : p));
            }, 800 + Math.random() * 1000);
        });
    }, []);

    // Drag & Drop
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    };

    // Paste Handling
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const pastedFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) pastedFiles.push(file);
            }
        }

        if (pastedFiles.length > 0) {
            e.preventDefault();
            handleFiles(pastedFiles);
            return;
        }

        // Handle large text paste
        const text = e.clipboardData.getData('text');
        if (text.length > 300) {
            e.preventDefault();
            const snippet = {
                id: Math.random().toString(36).substr(2, 9),
                content: text,
                timestamp: new Date()
            };
            setPastedContent(prev => [...prev, snippet]);

            if (!message) {
                setMessage("Analyzed pasted text...");
            }
        }
    };

    const handleSend = () => {
        if (!message.trim() && files.length === 0 && pastedContent.length === 0) return;
        onSendMessage({ message, files, pastedContent, model: selectedModel, isThinkingEnabled, numCases });
        setMessage("");
        setFiles([]);
        setPastedContent([]);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasContent = message.trim() || files.length > 0 || pastedContent.length > 0;

    return (
        <div
            className={`relative w-full max-w-2xl mx-auto transition-all duration-300 font-sans`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Main Container - matching the inspected element structure */}
            <div className={`
                !box-content flex flex-col mx-2 md:mx-0 items-stretch transition-all duration-200 relative z-10 rounded-[1.5rem] cursor-text border border-gray-200 
                shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.08)]
                bg-white font-sans antialiased
            `}>

                <div className="flex flex-col px-4 pt-5 pb-3 gap-2">

                    {/* 1. Artifacts (Files & Pastes) - Rendered ABOVE text input */}
                    {(files.length > 0 || pastedContent.length > 0) && (
                        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-1">
                            {pastedContent.map(content => (
                                <PastedContentCard
                                    key={content.id}
                                    content={content}
                                    onRemove={id => setPastedContent(prev => prev.filter(c => c.id !== id))}
                                />
                            ))}
                            {files.map(file => (
                                <FilePreviewCard
                                    key={file.id}
                                    file={file}
                                    onRemove={id => setFiles(prev => prev.filter(f => f.id !== id))}
                                />
                            ))}
                        </div>
                    )}

                    {/* 2. Input Area */}
                    {/* 2. Input Area */}
                    <div className="relative mb-1">
                        <div className="max-h-96 w-full overflow-y-auto custom-scrollbar font-sans break-words transition-opacity duration-200 min-h-[2.5rem] pl-1">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onPaste={handlePaste}
                                onKeyDown={handleKeyDown}
                                placeholder="How can I help you today?"
                                className="w-full bg-transparent border-0 outline-none text-gray-800 text-[16px] placeholder:text-gray-400 resize-none overflow-hidden py-0 leading-relaxed block font-normal antialiased"
                                rows={1}
                                autoFocus
                                style={{ minHeight: '1.5em' }}
                            />
                        </div>
                    </div>

                    {/* 2. Action Bar */}
                    <div className="flex gap-2 w-full items-center">
                        {/* Left Tools */}
                        <div className="relative flex-1 flex items-center shrink min-w-0 gap-1">

                            {/* Toggle Menu / Attach Button */}
                            {/* Toggle Menu / Attach Button - Compact & Subtle */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center justify-center relative shrink-0 transition-colors duration-200 h-8 w-8 rounded-lg active:scale-95 text-text-400 hover:text-text-200 hover:bg-bg-200"
                                type="button"
                                aria-label="Toggle menu"
                            >
                                <Icons.Plus className="w-4 h-4" />
                            </button>

                            {/* Search Depth Selector */}
                            <div className="flex shrink min-w-8 !shrink-0 relative group">
                                <button
                                    onClick={() => setIsNumCasesOpen(!isNumCasesOpen)}
                                    className={`inline-flex items-center justify-center relative shrink-0 transition-colors duration-200 h-8 rounded-lg px-2 active:scale-95 text-text-400 hover:text-text-200 hover:bg-bg-200 ${isNumCasesOpen ? 'bg-bg-200 text-text-200' : ''}`}
                                    type="button"
                                    aria-label="Set Search Depth"
                                >
                                    <Icons.Clock className="w-4 h-4 mr-1" />
                                    <span className="text-xs font-semibold">{numCases}</span>
                                    
                                    {/* Tooltip (only when closed) */}
                                    {!isNumCasesOpen && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-[11px] font-medium rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 flex items-center gap-1 shadow-sm tracking-wide">
                                            <span>Search Depth</span>
                                        </div>
                                    )}
                                </button>

                                {/* Popover for inputting number */}
                                {isNumCasesOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setIsNumCasesOpen(false)}
                                        />
                                        <div 
                                            className={`absolute ${hasMessages ? 'bottom-full origin-bottom mb-2' : 'top-full origin-top mt-2'} left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 flex flex-col gap-2 min-w-[180px] animate-fade-in`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-gray-700 tracking-wide uppercase">Search Depth</label>
                                                <span className="text-xs font-medium bg-[#F2D1C9] text-[#D16F54] px-1.5 py-0.5 rounded-md">{numCases} Cases</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="1" 
                                                max="30" 
                                                value={numCases}
                                                onChange={e => setNumCases(parseInt(e.target.value))}
                                                className="w-full accent-[#D16F54]"
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                                                <span>1</span>
                                                <span>15</span>
                                                <span>30</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* RAG Toggle Button */}
                            {onToggleRag && (
                                <div className="flex shrink min-w-8 !shrink-0">
                                    <button
                                        onClick={onToggleRag}
                                        className={`inline-flex items-center justify-center relative shrink-0 transition-colors duration-200 h-8 px-2.5 rounded-lg active:scale-95 group ${isRagEnabled ? 'text-[#D16F54] bg-[#FDF0E7]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                        type="button"
                                        aria-label="Toggle Case Retrieval"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRagEnabled ? 'opacity-100' : 'opacity-60'}>
                                            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                                            {!isRagEnabled && <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.5" className="text-gray-500" />}
                                        </svg>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-[11px] font-medium rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 flex items-center gap-1 shadow-sm tracking-wide">
                                            <span>{isRagEnabled ? 'Case Retrieval: ON' : 'Case Retrieval: OFF'}</span>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Filter Button */}
                            {onOpenFilters && (
                                <div className="flex shrink min-w-8 !shrink-0">
                                    <button
                                        onClick={onOpenFilters}
                                        className="inline-flex items-center justify-center relative shrink-0 transition-colors duration-200 h-8 w-8 rounded-lg active:scale-95 text-text-400 hover:text-text-200 hover:bg-bg-200 group"
                                        type="button"
                                        aria-label="Open Filters"
                                    >
                                        <Icons.Filter className="w-4 h-4" />
                                        {/* Tooltip */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-[11px] font-medium rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 flex items-center gap-1 shadow-sm tracking-wide">
                                            <span>Filters</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Tools */}
                        <div className="flex flex-row items-center min-w-0 gap-1">
                            {/* Model Selector */}
                            <div className="shrink-0 p-1 -m-1">
                                <ModelSelector
                                    models={models}
                                    selectedModel={selectedModel}
                                    onSelect={setSelectedModel}
                                    dropUp={hasMessages}
                                />
                            </div>

                            {/* Send Button */}
                            <div>
                                <button
                                    onClick={handleSend}
                                    disabled={!hasContent}
                                    className={`
                                        inline-flex items-center justify-center relative shrink-0 transition-colors h-8 w-8 !rounded-full
                                        ${hasContent
                                            ? 'bg-[#F2D1C9] text-white hover:bg-[#E8C5BD] shadow-sm'
                                            : 'bg-[#F2D1C9]/50 text-white/80 cursor-default'}
                                    `}
                                    type="button"
                                    aria-label="Send message"
                                >
                                    <Icons.ArrowUp className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drag Overlay */}
            {
                isDragging && (
                    <div className="absolute inset-0 bg-bg-200/90 border-2 border-dashed border-accent rounded-2xl z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
                        <Icons.Archive className="w-10 h-10 text-accent mb-2 animate-bounce" />
                        <p className="text-accent font-medium">Drop files to upload</p>
                    </div>
                )
            }

            {/* Hidden Input */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                    e.target.value = '';
                }}
            />

            {!hasMessages && (
                <div className="flex flex-col items-center gap-3 mt-4 animate-[fadeIn_0.5s_ease-out_forwards] opacity-0" style={{ animationDelay: '0.2s' }}>
                    <p className="text-[12px] text-gray-400 font-medium">
                        AI can make mistakes. Please check important information.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {[
                            { icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>, label: "Write" },
                            { icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6" /></svg>, label: "Learn" },
                            { icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>, label: "Code" },
                            { icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, label: "Life stuff" }
                        ].map((chip, index) => (
                            <button 
                                key={chip.label} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-[13px] font-medium transition-colors shadow-sm animate-[slideUpFade_0.5s_ease-out_forwards] opacity-0 translate-y-4"
                                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                            >
                                {chip.icon}
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClaudeChatInput;
