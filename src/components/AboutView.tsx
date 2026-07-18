import React from 'react';
import { Shield, Sparkles, Heart, Code, Globe, Coffee } from 'lucide-react';
import { motion } from 'motion/react';

export default function AboutView() {
  return (
    <motion.div 
      className="w-full max-w-4xl mx-auto px-6 py-10 md:py-16 text-left"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">Our Philosophy</h2>
        <p className="text-neutral-300 text-lg leading-relaxed">
          Why should understanding your chess games reside behind expensive paywalls?
        </p>
      </div>

      <div className="space-y-12">
        {/* Core Mission */}
        <div className="bg-[#141517] border border-neutral-800 rounded-2xl p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" /> Built for the Community
          </h3>
          <p className="text-neutral-300 text-sm leading-relaxed mb-4">
            Most leading chess platforms limit free users to just one "Game Review" per day, hiding annotations, mistake markers, and engine depth behind steep monthly memberships. 
          </p>
          <p className="text-neutral-300 text-sm leading-relaxed">
            MoveLens was founded on a simple principle: **the core tools required to learn, review, and enjoy chess should be accessible to everyone, everywhere, for free.** No signups, no data harvesting, no recurring subscriptions.
          </p>
        </div>

        {/* Bento features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#141517] border border-neutral-800 rounded-2xl p-6 shadow-md">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              100% Privacy-First
            </h4>
            <p className="text-neutral-400 text-xs leading-relaxed">
              We never track your games, request email address logins, or sell telemetry data to brokers. Your analysis stays yours.
            </p>
          </div>

          <div className="bg-[#141517] border border-neutral-800 rounded-2xl p-6 shadow-md">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              Open Source Philosophy
            </h4>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Powering our tactical insights is the state-of-the-art open-source Stockfish WASM engine. Transparent and community-driven.
            </p>
          </div>

          <div className="bg-[#141517] border border-neutral-800 rounded-2xl p-6 shadow-md">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Free Server Ingress
            </h4>
            <p className="text-neutral-400 text-xs leading-relaxed">
              By utilizing client-side WebAssembly computation, we cut infrastructure hosting overheads and forward those exact cost savings directly to you.
            </p>
          </div>

          <div className="bg-[#141517] border border-neutral-800 rounded-2xl p-6 shadow-md">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-400" />
              Support MoveLens
            </h4>
            <p className="text-neutral-400 text-xs leading-relaxed">
              MoveLens is fueled by voluntary donations from passionate players. If you love our annotation engine, share us with your local chess club!
            </p>
          </div>
        </div>

        {/* Closing card */}
        <div className="text-center border-t border-neutral-800 pt-8 mt-12">
          <p className="text-xs text-neutral-500">
            MoveLens Version 1.0.0 (Static UI Prototype). Engineered with ♟️ for players worldwide.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
