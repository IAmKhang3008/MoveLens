import React, { useState } from 'react';
import { Shield, Heart, Code, Globe, Coffee, ArrowRight, Github, X, ExternalLink, Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AboutViewProps {
  onNavigateToReview?: () => void;
  onNavigateToHome?: () => void;
}

export default function AboutView({ onNavigateToReview, onNavigateToHome }: AboutViewProps) {
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [sponsorSuccess, setSponsorSuccess] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(15);
  const [customAmount, setCustomAmount] = useState('');
  
  const [activeDetailsModal, setActiveDetailsModal] = useState<'privacy' | 'wasm' | null>(null);

  const handleSponsorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSponsorSuccess(true);
    setTimeout(() => {
      setSponsorSuccess(false);
      setIsSponsorModalOpen(false);
    }, 2500);
  };

  return (
    <motion.div 
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-16 text-left relative animate-fade-in"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <h2 className="text-[clamp(2rem,6vw,2.75rem)] font-black text-white mb-4 sm:mb-5 tracking-tight">
          About MoveLens
        </h2>
        <p 
          className="text-neutral-300 text-[clamp(1rem,3vw,1.2rem)] leading-relaxed max-w-[700px] mx-auto font-medium"
          style={{ maxWidth: '700px', marginInline: 'auto' }}
        >
          Free game review for every player, without paywalls.
        </p>
      </div>

      <div className="space-y-8 sm:space-y-12">
        {/* Core Mission Hero Card */}
        <div className="bg-[#141517] border border-neutral-800 rounded-2xl p-5 sm:px-8 sm:py-7 relative overflow-hidden shadow-xl transition-all duration-300 hover:border-neutral-700">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-[clamp(1.2rem,3vw,1.4rem)] font-extrabold text-white mb-4.5 flex items-center gap-2.5">
            <Heart className="w-5.5 h-5.5 text-red-500 fill-red-500/20" /> 
            <span>Built for Players</span>
          </h3>
          
          <p 
            className="text-neutral-300 mb-4 text-sm leading-[1.7]"
            style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)', lineHeight: '1.7' }}
          >
            Most leading chess platforms limit free users to just one "Game Review" per day, hiding annotations, mistake markers, and engine depth behind steep monthly memberships. 
          </p>
          <p 
            className="text-neutral-300 text-sm leading-[1.7]"
            style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)', lineHeight: '1.7' }}
          >
            MoveLens was founded on a simple principle: <strong className="text-white font-semibold">the core tools required to learn, review, and enjoy chess should be accessible to everyone, everywhere, for free.</strong> No signups, no data harvesting, no recurring subscriptions.
          </p>
        </div>

        {/* Bento features grid - 3 columns for user value */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Privacy-First */}
          <div className="bg-[#141517] border border-neutral-800 hover:border-neutral-750 rounded-2xl p-6 shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-4 group-hover:scale-105 transition-transform duration-300">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                100% Privacy-First
              </h4>
              <p 
                className="text-neutral-400 leading-relaxed font-normal"
                style={{ fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', lineHeight: '1.6' }}
              >
                We never track your games, request email address logins, or sell telemetry data to brokers. Your analysis stays yours.
              </p>
            </div>
            <button
              onClick={() => setActiveDetailsModal('privacy')}
              className="mt-6 w-full min-h-[44px] py-2.5 bg-neutral-900 hover:bg-neutral-850 active:scale-95 text-neutral-300 hover:text-white font-semibold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 border border-neutral-800/40 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              Privacy Details
            </button>
          </div>

          {/* Open Source Philosophy */}
          <div className="bg-[#141517] border border-neutral-800 hover:border-neutral-750 rounded-2xl p-6 shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform duration-300">
                <Code className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                Open Source Philosophy
              </h4>
              <p 
                className="text-neutral-400 leading-relaxed font-normal"
                style={{ fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', lineHeight: '1.6' }}
              >
                Powering our tactical insights is the state-of-the-art open-source Stockfish WASM engine. Transparent and community-driven.
              </p>
            </div>
            <a 
              href="https://github.com/official-stockfish/Stockfish"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full min-h-[44px] py-2.5 bg-neutral-900 hover:bg-neutral-850 active:scale-95 text-neutral-300 hover:text-white font-semibold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 border border-neutral-800/40"
            >
              <Github className="w-3.5 h-3.5" />
              View Stockfish GitHub
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
          </div>

          {/* Free Server Ingress */}
          <div className="bg-[#141517] border border-neutral-800 hover:border-neutral-750 rounded-2xl p-6 shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform duration-300">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                Free Server Ingress
              </h4>
              <p 
                className="text-neutral-400 leading-relaxed font-normal"
                style={{ fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', lineHeight: '1.6' }}
              >
                By utilizing client-side WebAssembly computation, we cut infrastructure hosting overheads and forward those exact cost savings directly to you.
              </p>
            </div>
            <button
              onClick={() => setActiveDetailsModal('wasm')}
              className="mt-6 w-full min-h-[44px] py-2.5 bg-neutral-900 hover:bg-neutral-850 active:scale-95 text-neutral-300 hover:text-white font-semibold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 border border-neutral-800/40 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              WASM Tech Details
            </button>
          </div>

        </div>

        {/* Dedicated Donations CTA Banner */}
        <div className="bg-gradient-to-r from-[#141517] to-[#1a1c1f] border border-amber-500/15 hover:border-amber-500/30 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 shadow-inner group-hover:rotate-3 transition-transform">
              <Coffee className="w-6 h-6 fill-amber-500/10" />
            </div>
            <div>
              <h4 className="text-white font-bold text-lg flex items-center gap-2 justify-center sm:justify-start">
                Support MoveLens
              </h4>
              <p 
                className="text-neutral-400 mt-1"
                style={{ fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)' }}
              >
                Love what we do? Help keep the engine running with a donation.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsSponsorModalOpen(true)}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 shrink-0 text-sm cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-current" />
            Sponsor Project
          </button>
        </div>

        {/* Large Centered Path-Forward CTA */}
        <div className="text-center bg-gradient-to-b from-[#141517] to-[#0d0e0f] border border-neutral-850 hover:border-neutral-800 rounded-2xl p-6 sm:p-8 md:p-12 mt-10 sm:mt-16 shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-green-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-[clamp(1.5rem,4vw,2rem)] font-black text-white mb-3 tracking-tight">
            Ready to analyze your first game?
          </h3>
          <p 
            className="text-neutral-400 max-w-md mx-auto mb-8 leading-relaxed"
            style={{ fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)' }}
          >
            Import your Chess.com or Lichess PGN and experience deep tactical game reviews powered by Stockfish.
          </p>
          <button
            onClick={onNavigateToReview}
            className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-green-500 hover:bg-green-400 active:scale-95 text-neutral-950 font-extrabold rounded-xl transition-all shadow-lg shadow-green-500/20 inline-flex items-center justify-center gap-2.5 text-base cursor-pointer"
          >
            Analyze Now
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

      </div>

      {/* MODAL COVERS */}
      <AnimatePresence>
        {/* SPONSOR MODAL */}
        {isSponsorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-neutral-950/75 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSponsorModalOpen(false)}
            />
            
            <motion.div 
              className="bg-[#0B0C10] border border-neutral-800 rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full max-h-[85dvh] overflow-y-auto relative shadow-2xl z-10"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button 
                onClick={() => setIsSponsorModalOpen(false)}
                className="absolute top-2.5 right-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              {sponsorSuccess ? (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 mb-6 animate-bounce">
                    <Heart className="w-8 h-8 fill-current" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Thank you so much!</h4>
                  <p className="text-neutral-400 text-sm max-w-xs mx-auto leading-relaxed">
                    Your contribution directly keeps the MoveLens project hosted, open-source, and entirely ad-free for chess enthusiasts worldwide.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSponsorSubmit} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <Heart className="w-6 h-6 fill-amber-500/10" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Sponsor MoveLens</h4>
                      <p className="text-neutral-400 text-xs">Choose how much you'd like to support</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 25].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount('');
                        }}
                        className={`min-h-[56px] py-2.5 px-1 rounded-xl font-bold border transition-all text-sm flex flex-col items-center justify-center tabular-nums cursor-pointer ${
                          selectedAmount === amount && !customAmount
                            ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-md shadow-amber-500/10'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <span>${amount}</span>
                        <span className="text-[9px] opacity-75 mt-0.5">One-time</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400 font-semibold block">Custom Amount ($)</label>
                    <input
                      type="number"
                      placeholder="Enter other amount"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      className="w-full min-h-[44px] bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl px-4 py-2.5 text-sm text-white font-semibold tabular-nums transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full min-h-[48px] py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-neutral-950 font-extrabold rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-sm tabular-nums cursor-pointer"
                    >
                      <span>Donate ${customAmount || selectedAmount || '0'}</span>
                    </button>
                    <p className="text-center text-[10px] text-neutral-500 mt-3 italic">
                      This is a secure simulation representing donor-tier backing.
                    </p>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* DETAILS MODALS */}
        {activeDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-neutral-950/75 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDetailsModal(null)}
            />
            
            <motion.div 
              className="bg-[#0B0C10] border border-neutral-800 rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full max-h-[85dvh] overflow-y-auto relative shadow-2xl z-10"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button 
                onClick={() => setActiveDetailsModal(null)}
                className="absolute top-2.5 right-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              {activeDetailsModal === 'privacy' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Privacy Statement</h4>
                      <p className="text-neutral-400 text-xs">Your keys, your logs, your play</p>
                    </div>
                  </div>
                  <div className="text-neutral-300 text-sm leading-relaxed space-y-3">
                    <p>
                      At MoveLens, privacy isn't a premium feature—it's the absolute standard. All computations happen in your browser:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-neutral-400 text-xs">
                      <li>Your uploaded chess files or PGN lists are parsed directly on your local device.</li>
                      <li>No central storage of games, IP addresses, or telemetry profiles is maintained.</li>
                      <li>The Stockfish analysis engine runs as client-side compiled WebAssembly, meaning move-calculations are handled directly on your local CPU.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">WebAssembly Architecture</h4>
                      <p className="text-neutral-400 text-xs">Native performance inside the browser</p>
                    </div>
                  </div>
                  <div className="text-neutral-300 text-sm leading-relaxed space-y-3">
                    <p>
                      Instead of renting thousands of high-end GPUs and servers and passing the cost onto you, we utilize WebAssembly:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-neutral-400 text-xs">
                      <li>The engine is compiled down from C++ into optimized WebAssembly bytecode (.wasm).</li>
                      <li>Your web browser executes this code with near-native speed using multithreading capabilities (SharedArrayBuffer) and SIMD instructions.</li>
                      <li>This lets you enjoy depth-18 analysis and complete game reviews for free, instantly, without queuing for central servers.</li>
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-neutral-900 flex justify-end">
                <button
                  onClick={() => setActiveDetailsModal(null)}
                  className="min-h-[44px] px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
