import React from 'react';
import { motion } from 'motion/react';
import { Award, Eye, AlertCircle, ClipboardPaste, Cpu, Sparkles, ChevronRight, Play, Star } from 'lucide-react';

interface LandingViewProps {
  onNavigateToReview: () => void;
}

export default function LandingView({ onNavigateToReview }: LandingViewProps) {
  // Step list
  const steps = [
    {
      number: "01",
      icon: <ClipboardPaste className="w-10 h-10 text-blue-400" />,
      title: "Paste your PGN",
      desc: "Copy-paste your game file directly.",
    },
    {
      number: "02",
      icon: <Cpu className="w-10 h-10 text-green-400" />,
      title: "Engine Analysis",
      desc: "AI analyzes every move in milliseconds.",
    },
    {
      number: "03",
      icon: <Sparkles className="w-10 h-10 text-amber-400" />,
      title: "Get Visual Summary",
      desc: "View brilliant moves and missed tactics instantly.",
    },
  ];

  // Generate random floating particles for the hero background
  const particles = React.useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      size: Math.random() * 5 + 3, // 3px to 8px
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 15 + 15, // 15s to 30s
      delay: Math.random() * -15,
    }));
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      {/* 1. Hero Section Wrapper with Chessboard Background Grid & Particles */}
      <div className="w-full relative overflow-hidden bg-gradient-to-b from-[#0a0a0c] via-[#0c0d10] to-[#0a0a0c] border-b border-neutral-900/40">
        
        {/* Subtle Background Chessboard Grid Overlay (2-3% opacity) */}
        <div className="absolute inset-0 grid grid-cols-8 md:grid-cols-12 opacity-[0.025] pointer-events-none select-none z-0">
          {Array(96).fill(null).map((_, i) => {
            const row = Math.floor(i / 12);
            const col = i % 12;
            const isDarkSquare = (row + col) % 2 === 1;
            return (
              <div 
                key={i} 
                className={`border-r border-b border-neutral-800 aspect-square ${isDarkSquare ? 'bg-neutral-600' : ''}`}
              />
            );
          })}
        </div>

        {/* Floating Chess Particles / Cosmic Dust */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-green-400/15 shadow-[0_0_8px_rgba(74,222,128,0.25)]"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.left}%`,
                top: `${p.top}%`,
              }}
              animate={{
                y: [0, -120, 0],
                x: [0, Math.sin(p.id) * 35, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <section className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-28 flex flex-col lg:flex-row items-center justify-between gap-12 md:gap-16">
          <motion.div 
            className="flex-1 flex flex-col items-start text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-semibold text-neutral-400 mb-6 shadow-inner backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              100% Free Chess Analytics
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-white leading-tight mb-6">
              Understand <br className="hidden md:inline" />
              Every <motion.span 
                className="inline-block text-[#22c55e] font-black"
                style={{ textShadow: "0 0 25px rgba(34,197,94,0.55)" }}
                animate={{ 
                  scale: [1, 1.02, 1],
                  filter: [
                    "drop-shadow(0 0 12px rgba(34,197,94,0.35))",
                    "drop-shadow(0 0 30px rgba(34,197,94,0.7))",
                    "drop-shadow(0 0 12px rgba(34,197,94,0.35))"
                  ]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4, 
                  ease: "easeInOut" 
                }}
              >
                Move.
              </motion.span>
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-200 mb-8 max-w-lg leading-relaxed font-bold">
              Upload your PGN. Instantly uncover brilliant moves and engine insights—no paywall.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <button
                onClick={onNavigateToReview}
                className="relative overflow-hidden px-8 py-4 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-neutral-950 font-black transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(74,222,128,0.25)] hover:shadow-[0_0_35px_rgba(74,222,128,0.45)] text-base cursor-pointer group"
              >
                {/* Shimmer Sweep */}
                <motion.div 
                  className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none"
                  initial={{ left: '-100%' }}
                  animate={{ left: '200%' }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
                />
                Analyze Now
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div className="flex flex-col justify-center text-center sm:text-left">
                <span className="text-xs text-neutral-200 font-bold">No account required.</span>
                <span className="text-xs text-neutral-400 font-medium">100% free forever.</span>
              </div>
            </div>

          {/* Premium Social Proof Section */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-neutral-900/50 w-full max-w-sm">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-950 flex items-center justify-center text-[9px] font-black text-neutral-300">W</div>
              <div className="w-7 h-7 rounded-full bg-neutral-700 border border-neutral-950 flex items-center justify-center text-[9px] font-black text-neutral-200">G</div>
              <div className="w-7 h-7 rounded-full bg-neutral-600 border border-neutral-950 flex items-center justify-center text-[9px] font-black text-neutral-100">B</div>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                {Array(5).fill(null).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs font-black text-neutral-200 ml-1.5">4.9/5</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-semibold leading-none mt-1">Join 5,000+ players evaluating their tactics</p>
            </div>
          </div>
        </motion.div>

        {/* High-Fidelity MoveLens Dashboard Mockup */}
        <motion.div 
          className="flex-1 w-full max-w-lg relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Outer Ambient Glow */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-green-500/10 via-blue-500/5 to-indigo-500/10 rounded-3xl blur-2xl pointer-events-none" />
          
          {/* macOS-style App Window Container */}
          <div className="w-full bg-[#141517] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
            
            {/* 1. Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0c0d0e] border-b border-neutral-900/60 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-[10px] font-mono font-bold text-neutral-500 ml-3 uppercase tracking-wider">Review Workspace</span>
              </div>
              
              <div className="px-2.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[9px] font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Stockfish 18 Active
              </div>
            </div>

            {/* 2. Workspace Body */}
            <div className="p-4 flex gap-4 bg-[#141517]">
              
              {/* Left Column: Evaluation Bar + Miniature Board */}
              <div className="flex gap-2.5 flex-1">
                
                {/* Miniature Vertical Eval Bar */}
                <div className="w-3.5 bg-neutral-950 rounded-full overflow-hidden flex flex-col justify-between border border-neutral-800/60 relative">
                  <div className="h-[35%] bg-neutral-950" />
                  <div className="h-[65%] bg-neutral-100 relative">
                    <span className="absolute bottom-1.5 left-0 right-0 text-[8px] font-black font-mono text-neutral-950 text-center select-none leading-none">+2.40</span>
                  </div>
                </div>

                {/* Miniature Board (8x8 styled perfectly) */}
                <div className="flex-1 aspect-square rounded-lg overflow-hidden border border-neutral-900 relative">
                  <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                    {Array(64).fill(null).map((_, index) => {
                      const r = Math.floor(index / 8);
                      const c = index % 8;
                      const isLight = (r + c) % 2 === 0;
                      
                      // Highlight square f7 (brilliant capture) - row 1, col 5
                      const isF7 = r === 1 && c === 5;

                      return (
                        <div
                          key={index}
                          className={`relative flex items-center justify-center ${
                            isLight ? 'bg-neutral-850' : 'bg-[#18191c]'
                          } ${isF7 ? 'bg-green-500/25 ring-1 ring-inset ring-green-500/35' : ''}`}
                        >
                          {/* Place elegant chess pieces */}
                          {r === 0 && c === 1 && <span className="text-xs text-neutral-500 select-none">♞</span>}
                          {r === 1 && c === 5 && (
                            <span className="text-base text-white drop-shadow-[0_0_8px_rgba(74,222,128,0.7)] select-none font-bold animate-pulse">♕</span>
                          )}
                          {r === 0 && c === 5 && <span className="text-xs text-neutral-400 select-none">♚</span>}
                          
                          {/* Annotation icon floating above the square */}
                          {isF7 && (
                            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-green-500 text-[7px] font-black text-neutral-950 shadow-md">
                              !!
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Mini Move List panel */}
              <div className="w-36 flex flex-col gap-2 shrink-0 text-left select-none">
                <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider pb-1 border-b border-neutral-850">
                  Game Move Log
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5 text-[10px] font-medium text-neutral-400 font-mono">
                  <div className="flex justify-between py-1 px-1.5 rounded hover:bg-neutral-900/40">
                    <span>15. Bxd7</span>
                    <span>Nxd7</span>
                  </div>
                  
                  {/* Highlighted Brilliant move */}
                  <div className="flex items-center justify-between py-1 px-1.5 rounded bg-green-500/10 border border-green-500/20 text-white font-bold shadow-sm">
                    <span>16. Qb8+!!</span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-green-500 text-neutral-950 font-black">BRILLIANT</span>
                  </div>

                  <div className="flex justify-between py-1 px-1.5 rounded text-neutral-600">
                    <span>17. Rd8#</span>
                    <span>1-0</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-neutral-900/50 border border-neutral-850 text-[9px] leading-relaxed text-neutral-400">
                  💡 <span className="text-neutral-200 font-semibold">Morphy's Sacrifice:</span> White sacrifices the Queen to force an elegant checkmate in 1.
                </div>
              </div>

            </div>

            {/* 3. Engine Telemetry Overlay Footer */}
            <div className="bg-[#0c0d0e] px-4 py-2.5 border-t border-neutral-900 flex items-center justify-between text-[10px] font-mono text-neutral-400 select-none">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>NPS: <strong className="text-blue-400">842,510</strong></span>
              </div>
              <div>
                <span>Depth: <strong className="text-white">15/15</strong></span>
              </div>
              <div className="text-green-400 font-bold">
                Eval: +2.40 (White leads)
              </div>
            </div>

          </div>
        </motion.div>
      </section>
    </div>

      {/* 2. Feature Highlights */}
      <section className="w-full bg-[#111113] border-y border-neutral-900 py-16 md:py-24">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Why review with MoveLens?</h2>
            <p className="text-neutral-300 text-sm md:text-base">
              Unlike traditional chess platforms, we believe deep game evaluation shouldn't reside behind expensive premium payroll memberships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Card 1 - Brilliant */}
            <motion.div 
              className="p-8 rounded-2xl bg-neutral-900/40 backdrop-blur-md border border-white/[0.04] shadow-2xl hover:border-green-500/40 hover:shadow-[0_15px_40px_-15px_rgba(34,197,94,0.15)] transition-all duration-500 flex flex-col items-start text-left group relative overflow-hidden"
              whileHover={{ y: -8 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-green-500/10 transition-all duration-500" />
              <div className="w-24 h-24 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-8 group-hover:bg-green-500/20 group-hover:border-green-500/30 transition-all shadow-lg shadow-green-500/5 relative overflow-hidden">
                <motion.div
                  className="flex items-center justify-center"
                  whileHover={{ rotate: 180, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Award className="w-14 h-14 text-green-400 animate-pulse" />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Brilliant Move Detection</h3>
              <p className="text-lg md:text-xl font-bold text-neutral-400 leading-snug mt-2">
                AI highlights your best moves so you learn what you did right.
              </p>
            </motion.div>

            {/* Card 2 - Clean & Calm */}
            <motion.div 
              className="p-8 rounded-2xl bg-neutral-900/40 backdrop-blur-md border border-white/[0.04] shadow-2xl hover:border-blue-500/40 hover:shadow-[0_15px_40px_-15px_rgba(59,130,246,0.15)] transition-all duration-500 flex flex-col items-start text-left group relative overflow-hidden"
              whileHover={{ y: -8 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-all duration-500" />
              <div className="w-24 h-24 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-all shadow-lg shadow-blue-500/5 relative overflow-hidden">
                <motion.div
                  className="flex items-center justify-center"
                  whileHover={{ rotate: 180, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Eye className="w-14 h-14 text-blue-400" />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Clean & Quick Interface</h3>
              <p className="text-lg md:text-xl font-bold text-neutral-400 leading-snug mt-2">
                Zero clutter. Just pure, distraction-free analysis.
              </p>
            </motion.div>

            {/* Card 3 - Mistakes */}
            <motion.div 
              className="p-8 rounded-2xl bg-neutral-900/40 backdrop-blur-md border border-white/[0.04] shadow-2xl hover:border-red-500/40 hover:shadow-[0_15px_40px_-15px_rgba(239,68,68,0.15)] transition-all duration-500 flex flex-col items-start text-left group relative overflow-hidden"
              whileHover={{ y: -8 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-red-500/10 transition-all duration-500" />
              <div className="w-24 h-24 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 group-hover:bg-red-500/20 group-hover:border-red-500/30 transition-all shadow-lg shadow-red-500/5 relative overflow-hidden">
                <motion.div
                  className="flex items-center justify-center"
                  whileHover={{ rotate: 180, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <AlertCircle className="w-14 h-14 text-red-400" />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No-Paywall Learning</h3>
              <p className="text-lg md:text-xl font-bold text-neutral-400 leading-snug mt-2">
                Full engine insights. Completely free, forever.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. How It Works */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">How MoveLens Works</h2>
          <p className="text-neutral-300">
            Reviewing your games is simplified into three rapid steps. Paste, analyze, learn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
          {/* Connecting line for desktop with animated glowing particle */}
          <div className="hidden lg:block absolute top-14 left-[15%] right-[15%] h-[2px] bg-neutral-850 z-0 overflow-hidden rounded-full">
            <motion.div 
              className="h-full w-44 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_8px_#4ade80]"
              animate={{ x: ['-100%', '350%'] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            />
          </div>

          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              className="flex flex-col items-center text-center relative z-10 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              {/* Number circle */}
              <div className="w-20 h-20 rounded-full bg-neutral-950 border-2 border-neutral-800 flex items-center justify-center mb-6 relative group-hover:border-green-500/40 transition-all shadow-xl">
                {step.icon}
                <span className="absolute -top-2 -right-2 bg-[#1c1d22] border border-neutral-800 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-neutral-300">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">{step.title}</h3>
              <p className="text-neutral-300 text-base leading-relaxed max-w-sm font-bold">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner bottom */}
        <motion.div 
          className="mt-20 p-8 md:p-12 rounded-3xl bg-neutral-900 border border-neutral-800 text-center relative overflow-hidden shadow-2xl"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.01 }}
        >
          {/* Chessboard Grid Overlay Background (Subtle dark grey checkerboard) */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-[0.03] pointer-events-none select-none">
            {Array(72).fill(null).map((_, i) => {
              const row = Math.floor(i / 12);
              const col = i % 12;
              const isDarkSquare = (row + col) % 2 === 1;
              return (
                <div 
                  key={i} 
                  className={`border-r border-b border-neutral-700 ${isDarkSquare ? 'bg-neutral-500' : ''}`}
                />
              );
            })}
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <h3 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">Ready to analyze your brilliant tactics?</h3>
          <p className="text-lg md:text-xl font-bold text-neutral-300 max-w-xl mx-auto mb-8">
            Upload your first PGN free. No sign-up needed.
          </p>
          <button
            onClick={onNavigateToReview}
            className="relative overflow-hidden px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_25px_rgba(59,130,246,0.25)] hover:shadow-[0_0_35px_rgba(34,197,94,0.35)] inline-flex items-center gap-2 cursor-pointer group animate-pulse"
          >
            {/* Shimmer Sweep */}
            <motion.div 
              className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
              initial={{ left: '-100%' }}
              animate={{ left: '200%' }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1.5 }}
            />
            Analyze Now
            <Play className="w-4 h-4 fill-white text-white" />
          </button>
        </motion.div>
      </section>
    </div>
  );
}
