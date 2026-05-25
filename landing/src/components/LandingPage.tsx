import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Plus, Mail, X, CheckCircle2, Terminal, Code2, Copy, Cpu, Network, Database } from "lucide-react";
import { supabase } from '../supabaseClient';
import '../landing.css';

interface Props {
  onAuthComplete: (userId: string, isGuest: boolean, displayName: string) => void;
}

function Logo() {
  return (
    <div className="flex items-center gap-2 text-sm font-medium tracking-tight">
      <div className="grid h-5 w-5 grid-cols-3 grid-rows-3 gap-[2px]">
        {[1, 1, 1, 1, 0, 1, 1, 1, 1].map((v, i) => (
          <div key={i} className={v ? "bg-foreground" : "bg-transparent"} />
        ))}
      </div>
      <span className="text-base">VORA</span>
    </div>
  );
}

function Nav({ onRequestAccess }: { onRequestAccess: () => void }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between rounded-full border border-border bg-background/60 px-5 py-2.5 backdrop-blur-xl">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {[
            { name: "Architecture", id: "home" },
            { name: "Telemetry", id: "corpus" },
            { name: "SDKs", id: "docs" },
            { name: "Beta Access", id: "pricing" }
          ].map((item) => (
            <button 
              key={item.name} 
              onClick={() => scrollTo(item.id)}
              className="text-xs font-mono tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={import.meta.env.VITE_APP_URL || "http://localhost:8080/"}
            className="hidden text-xs font-medium text-muted-foreground transition-colors hover:text-foreground md:block"
          >
            Launch UI
          </a>
          <button
            onClick={onRequestAccess}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:scale-[1.03]"
          >
            Request API Key <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}

function Hero({ onRequestAccess }: { onRequestAccess: () => void }) {
  return (
    <section id="home" className="relative mx-auto max-w-[1200px] px-4 pt-28 md:pt-32">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid min-h-[620px] grid-cols-1 md:grid-cols-[1.1fr_1fr]">
          <div className="relative flex flex-col justify-between p-8 md:p-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center justify-between"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                ◍ v1.0.4-beta (local)
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-blink" />
                sys.online
              </span>
            </motion.div>

            <div className="py-12">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-balance text-[44px] font-medium leading-[1.02] tracking-[-0.03em] md:text-[52px]"
              >
                Local RAG pipeline
                <br />
                <span className="text-muted-foreground">for judicial precedent.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground"
              >
                VORA is an embedded vector-retrieval engine built over a persistent ChromaDB instance. Formulate arguments and query 40,000+ localized legal cases with microsecond latency.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <a
                href={import.meta.env.VITE_APP_URL || "http://localhost:8080/"}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-foreground py-2.5 pl-5 pr-2 text-xs font-medium text-background transition-transform hover:scale-[1.03]"
              >
                Launch Web UI
                <span className="grid h-7 w-7 place-items-center rounded-full bg-background text-foreground transition-transform group-hover:rotate-90">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </a>
              <button
                onClick={onRequestAccess}
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-border bg-transparent py-2.5 px-5 text-xs font-medium text-foreground transition-colors hover:bg-border/50"
              >
                Request API Access <Terminal className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          </div>

          {/* Right video */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="relative min-h-[320px] overflow-hidden border-t border-border md:border-l md:border-t-0"
          >
            <video
              src="/stockvideo.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 ascii-overlay" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/10 to-background/60" />

            {/* Architecture Overlay */}
            <div className="absolute right-6 top-6 flex flex-col gap-2 font-mono text-[10px] text-foreground/80">
              <div className="flex items-center justify-between rounded bg-background/80 px-2 py-1 backdrop-blur">
                <span>FastAPI Gateway</span><span className="text-emerald-400">OK</span>
              </div>
              <div className="flex items-center justify-between rounded bg-background/80 px-2 py-1 backdrop-blur">
                <span>Ollama Embeddings</span><span className="text-emerald-400">OK</span>
              </div>
              <div className="flex items-center justify-between rounded bg-background/80 px-2 py-1 backdrop-blur">
                <span>Chroma VectorStore</span><span className="text-emerald-400">OK</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Counter({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, margin: "-50px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  );
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration: 2, ease: [0.22, 1, 0.36, 1] });
    const unsub = rounded.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [inView, to, mv, rounded]);

  return <span ref={ref}>{display}{suffix}</span>;
}

function AnimatedBar({ value, delay = 0, color = "bg-foreground" }: { value: number; delay?: number; color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-50px" });
  return (
    <div ref={ref} className="h-1 w-full overflow-hidden bg-border rounded-full">
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: `${value}%` } : { width: 0 }}
        transition={{ duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  );
}

function Sparkline() {
  const data = [14, 22, 18, 30, 26, 40, 34, 48, 42, 56, 50, 62, 58, 70, 66, 80, 74, 92, 86, 100];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-50px" });
  return (
    <div ref={ref} className="mt-6 flex h-16 items-end gap-1">
      {data.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={inView ? { height: `${h}%` } : { height: 0 }}
          transition={{ duration: 0.6, delay: i * 0.035, ease: "easeOut" }}
          className={i > 14 ? "flex-1 bg-foreground" : "flex-1 bg-border-strong"}
        />
      ))}
    </div>
  );
}

function CorpusAnalytics() {
  const stats = [
    { to: 40213, suffix: "", l: "Indexed Documents" },
    { to: 2.1, suffix: "B", l: "Embedded Tokens", decimals: 1 },
    { to: 384, suffix: "", l: "Vector Dimensions (mxbai)" },
    { to: 98.4, suffix: "%", l: "Cosine Recall @ 10", decimals: 1 },
  ];

  const live = [
    { to: 14208, l: "Queries (24h)" },
    { to: 12, l: "Active Nodes" },
    { to: 112, l: "Avg Tokens/Sec" },
    { to: 99.9, suffix: "%", l: "Uptime" },
  ];

  return (
    <section id="corpus" className="mx-auto max-w-[1200px] px-4 py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="mb-16 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
            <Cpu className="h-3 w-3" /> / 01 — telemetry
          </div>
          <h2 className="max-w-2xl text-balance text-3xl font-medium tracking-[-0.02em] md:text-5xl">
            Bare-metal performance.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Local inferencing bypasses network bottlenecks, allowing microsecond document retrieval over millions of embeddings.
        </p>
      </motion.div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-surface p-8"
          >
            <div className="text-4xl font-medium tracking-[-0.03em] md:text-5xl">
              <Counter to={s.to} suffix={s.suffix} decimals={s.decimals ?? 0} />
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {s.l}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-px grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {/* retrieval performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="bg-surface p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Network className="h-3 w-3" /> API Latency
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-blink" />
          </div>
          <div className="space-y-5">
            {[
              { k: "p50 (Retrieval)", v: "12 ms", bar: 15, color: "bg-emerald-400" },
              { k: "p90 (Retrieval)", v: "28 ms", bar: 30, color: "bg-emerald-500" },
              { k: "p99 (Retrieval)", v: "84 ms", bar: 85, color: "bg-amber-500" },
              { k: "TTFT (Streaming)", v: "142 ms", bar: 100, color: "bg-foreground" },
            ].map((row, i) => (
              <div key={row.k}>
                <div className="mb-2 flex justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">{row.k}</span>
                  <span className="text-foreground">{row.v}</span>
                </div>
                <AnimatedBar value={row.bar} delay={i * 0.15} color={row.color} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* live activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-surface p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Inference Throughput
            </div>
            <span className="font-mono text-[10px] text-foreground">↑ 12%</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {live.map((s) => (
              <div key={s.l} className="rounded-md border border-border bg-background p-4">
                <div className="text-2xl font-medium tracking-tight">
                  <Counter to={s.to} suffix={s.suffix} />
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
          <Sparkline />
        </motion.div>

        {/* query domain distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-surface p-8"
        >
          <div className="mb-6 text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Database className="h-3 w-3" /> Query Distribution
          </div>
          <div className="space-y-4">
            {[
              { k: "Constitutional", v: 32 },
              { k: "Criminal", v: 24 },
              { k: "Civil & Tort", v: 18 },
              { k: "Commercial", v: 14 },
              { k: "Tax & Revenue", v: 8 },
              { k: "Labour & Service", v: 4 },
            ].map((row, i) => (
              <div key={row.k} className="flex items-center gap-3">
                <div className="w-32 text-xs text-muted-foreground">{row.k}</div>
                <div className="flex-1">
                  <AnimatedBar value={row.v * 3} delay={i * 0.1} />
                </div>
                <div className="w-10 text-right text-xs font-mono">{row.v}%</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DocsSection() {
  const [activeTab, setActiveTab] = useState<'node' | 'python'>('python');

  const snippets = {
    python: `import vora
from vora import Client

# Initialize the Vora client
client = Client(api_key="sk_live_...")

# Perform semantic search over the corpus
results = client.search(
    query="Right to privacy under Article 21",
    top_k=3,
    filters={"domain": "constitutional"}
)

for case in results.cases:
    print(f"{case.title} - Confidence: {case.score}")
    print(case.summary)`,
    node: `import { VoraClient } from '@vora/sdk';

// Initialize the client
const vora = new VoraClient({ apiKey: process.env.VORA_KEY });

async function queryCorpus() {
  // Perform semantic search
  const response = await vora.search({
    query: "Right to privacy under Article 21",
    topK: 3,
    filters: { domain: "constitutional" }
  });

  response.cases.forEach(c => {
    console.log(\`\${c.title} - Score: \${c.score}\`);
  });
}`
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
  };

  return (
    <section id="docs" className="mx-auto max-w-[1200px] px-4 py-32 border-t border-border">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="mb-16 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
            <Code2 className="h-3 w-3" /> / 02 — integration SDKs
          </div>
          <h2 className="max-w-2xl text-balance text-3xl font-medium tracking-[-0.02em] md:text-5xl">
            Integrate seamlessly.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Use our official, fully-typed SDKs to embed Supreme Court intelligence directly into your internal tooling.
        </p>
      </motion.div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-[1fr_2fr]">
        <div className="bg-surface p-8 flex flex-col gap-4">
          <h3 className="text-xl font-medium mb-2">Supported Environments</h3>
          <button 
            onClick={() => setActiveTab('python')}
            className={`text-left px-4 py-3 rounded-lg border text-sm font-mono transition-colors ${activeTab === 'python' ? 'border-foreground bg-background text-foreground' : 'border-transparent text-muted-foreground hover:bg-border/50'}`}
          >
            Python 3.9+
          </button>
          <button 
            onClick={() => setActiveTab('node')}
            className={`text-left px-4 py-3 rounded-lg border text-sm font-mono transition-colors ${activeTab === 'node' ? 'border-foreground bg-background text-foreground' : 'border-transparent text-muted-foreground hover:bg-border/50'}`}
          >
            Node.js (TypeScript)
          </button>
          <div className="mt-auto pt-8">
            <div className="rounded-lg bg-background border border-border p-4">
              <div className="text-xs font-medium mb-1">Package Installation</div>
              <div className="font-mono text-[10px] text-muted-foreground mb-3">Install via package manager</div>
              <code className="block bg-border/50 px-3 py-2 rounded text-xs font-mono text-foreground">
                {activeTab === 'python' ? 'pip install vora-sdk' : 'npm install @vora/sdk'}
              </code>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0D0D] p-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-white/10" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
            </div>
            <button onClick={copyCode} className="text-white/40 hover:text-white transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="font-mono text-xs leading-loose text-white/80">
              <code>{snippets[activeTab]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection({ onRequestAccess }: { onRequestAccess: () => void }) {
  return (
    <section id="pricing" className="mx-auto max-w-[1200px] px-4 py-32 border-t border-border">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="mb-16 text-center"
      >
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          / 03 — beta phase access
        </div>
        <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] md:text-5xl mb-4">
          Enterprise power. Zero cost.
        </h2>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          VORA is currently in an exclusive local-beta phase. All API limits are lifted and enterprise features are unlocked for early integrators.
        </p>
      </motion.div>

      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col rounded-2xl border border-foreground bg-surface p-8 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-foreground text-background px-4 py-1 rounded-bl-xl font-mono text-[10px] font-bold uppercase tracking-widest">
            BETA ACTIVE
          </div>
          
          <h3 className="text-xl font-medium">Pro Implementation</h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-medium tracking-tight text-foreground">$0</span>
            <span className="text-xl text-muted-foreground line-through decoration-red-500/50">$499</span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Full access to the local API gateway, SDKs, and complete Supreme Court embeddings database.
          </p>
          
          <ul className="my-8 flex-1 space-y-4">
            {[
              "Unlimited local queries & tokens",
              "Access to Python & Node SDKs",
              "Sub-50ms retrieval latency",
              "Offline deployment capability",
              "Commercial usage rights (Beta)"
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-foreground" />
                {f}
              </li>
            ))}
          </ul>
          
          <button
            onClick={onRequestAccess}
            className="w-full rounded-xl py-3 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Join the Beta Waitlist
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function AccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-2xl"
        >
          <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>

          {!submitted ? (
            <>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-border">
                <Terminal className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="mb-2 text-2xl font-medium tracking-tight">Request API Access</h2>
              <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
                We are currently onboarding developers for local implementations. Enter your work email and our integration team will provide you with a deployment key.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com" 
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-foreground"
                  />
                </div>
                <button type="submit" className="w-full rounded-xl bg-foreground py-2.5 text-sm font-medium text-background hover:bg-foreground/90">
                  Request Key
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="mb-2 text-2xl font-medium tracking-tight">Request received</h2>
              <p className="text-sm text-muted-foreground">
                We've added {email} to the priority integration queue. Our engineering team will reach out with your beta credentials shortly.
              </p>
              <button onClick={onClose} className="mt-8 w-full rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated">
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center">
        <Logo />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          © 2026 VORA · API Gateway
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage({ onAuthComplete }: Props) {
  const [showAccessModal, setShowAccessModal] = useState(false);

  useEffect(() => {
    document.body.style.overflow = showAccessModal ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'hidden'; };
  }, [showAccessModal]);

  return (
    <div className="lovable-landing min-h-screen font-sans">
      <Nav onRequestAccess={() => setShowAccessModal(true)} />
      <Hero onRequestAccess={() => setShowAccessModal(true)} />
      <CorpusAnalytics />
      <DocsSection />
      <PricingSection onRequestAccess={() => setShowAccessModal(true)} />
      <Footer />
      
      <AccessModal isOpen={showAccessModal} onClose={() => setShowAccessModal(false)} />
    </div>
  );
}
