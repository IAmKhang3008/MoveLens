import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Menu, X, Eye, HelpCircle } from 'lucide-react';
import LandingView from './components/LandingView';
import ReviewView from './components/ReviewView';
import AboutView from './components/AboutView';
import GuideView from './components/GuideView';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'review' | 'about' | 'guide'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [direction, setDirection] = useState<number>(1); // 1 = forward (sliding left), -1 = backward (sliding right)

  // Refs for tracking swipe gestures on mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  // Simple handler to switch page views
  const navigateTo = (view: 'home' | 'review' | 'about' | 'guide') => {
    const views: ('home' | 'review' | 'about' | 'guide')[] = ['home', 'review', 'about', 'guide'];
    const fromIndex = views.indexOf(currentView);
    const toIndex = views.indexOf(view);
    
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      setDirection(toIndex > fromIndex ? 1 : -1);
    }
    
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const diffX = touchEndRef.current.x - touchStartRef.current.x;
    const diffY = touchEndRef.current.y - touchStartRef.current.y;

    const minSwipeDistance = 60; // minimum pixels to count as swipe
    const isHorizontal = Math.abs(diffX) > Math.abs(diffY) * 1.5;

    if (isHorizontal && Math.abs(diffX) > minSwipeDistance) {
      const views: ('home' | 'review' | 'about' | 'guide')[] = ['home', 'review', 'about', 'guide'];
      const currentIndex = views.indexOf(currentView);

      if (diffX > 0) {
        // Swiped Right -> Go to previous page
        if (currentIndex > 0) {
          const prevView = views[currentIndex - 1];
          navigateTo(prevView);
        }
      } else {
        // Swiped Left -> Go to next page
        if (currentIndex < views.length - 1) {
          const nextView = views[currentIndex + 1];
          navigateTo(nextView);
        }
      }
    }

    // Reset coordinates
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white font-sans flex flex-col justify-between selection:bg-green-500/30 selection:text-green-300">
      
      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-[#0B0C10]/85 backdrop-blur-md border-b border-neutral-900/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          
          {/* Logo with blue-to-green gradient and lens icon */}
          <button 
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 group transition-transform active:scale-95"
            aria-label="MoveLens Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-green-500 flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:rotate-6 transition-transform duration-300">
              <Search className="w-4.5 h-4.5 text-neutral-950 stroke-[3]" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-green-400 text-transparent bg-clip-text">
              MoveLens
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigateTo('home')}
              className={`text-sm font-semibold tracking-wide transition-colors relative py-1.5 ${
                currentView === 'home' 
                  ? 'text-green-400' 
                  : 'text-neutral-400 hover:text-blue-400'
              }`}
            >
              Home
              {currentView === 'home' && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => navigateTo('review')}
              className={`text-sm font-semibold tracking-wide transition-colors relative py-1.5 ${
                currentView === 'review' 
                  ? 'text-green-400' 
                  : 'text-neutral-400 hover:text-blue-400'
              }`}
            >
              Review
              {currentView === 'review' && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => navigateTo('about')}
              className={`text-sm font-semibold tracking-wide transition-colors relative py-1.5 ${
                currentView === 'about' 
                  ? 'text-green-400' 
                  : 'text-neutral-400 hover:text-blue-400'
              }`}
            >
              About
              {currentView === 'about' && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => navigateTo('guide')}
              className={`text-sm font-semibold tracking-wide transition-colors relative py-1.5 ${
                currentView === 'guide' 
                  ? 'text-green-400' 
                  : 'text-neutral-400 hover:text-blue-400'
              }`}
            >
              Developer Guide
              {currentView === 'guide' && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </nav>

          {/* Right Header Controls (Avatar placeholder & Mobile toggle) */}
          <div className="flex items-center gap-4">
            {/* User profile avatar placeholder circle */}
            <div 
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2C2C2C] to-[#3A3A3A] border border-neutral-700/60 flex items-center justify-center cursor-help shadow-inner group relative"
              title="Profile placeholder"
            >
              <span className="text-xs font-bold text-neutral-400 group-hover:text-white transition-colors font-mono">
                GM
              </span>
              
              {/* Tooltip */}
              <span className="absolute right-0 top-11 scale-0 group-hover:scale-100 transition-all duration-150 origin-top-right bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                Offline Mode (No login required)
              </span>
            </div>

            {/* Mobile menu hamburger toggle button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Collapsible Mobile Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden absolute top-16 left-0 right-0 bg-[#0B0C10] border-b border-neutral-900 shadow-2xl flex flex-col p-6 gap-4 z-40"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => navigateTo('home')}
                className={`py-3 text-left text-sm font-bold border-b border-neutral-900/50 flex items-center justify-between ${
                  currentView === 'home' ? 'text-green-400' : 'text-neutral-400'
                }`}
              >
                <span>Home</span>
                {currentView === 'home' && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
              </button>
              
              <button
                onClick={() => navigateTo('review')}
                className={`py-3 text-left text-sm font-bold border-b border-neutral-900/50 flex items-center justify-between ${
                  currentView === 'review' ? 'text-green-400' : 'text-neutral-400'
                }`}
              >
                <span>Review Game Panel</span>
                {currentView === 'review' && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
              </button>

              <button
                onClick={() => navigateTo('about')}
                className={`py-3 text-left text-sm font-bold border-b border-neutral-900/50 flex items-center justify-between ${
                  currentView === 'about' ? 'text-green-400' : 'text-neutral-400'
                }`}
              >
                <span>About MoveLens</span>
                {currentView === 'about' && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
              </button>

              <button
                onClick={() => navigateTo('guide')}
                className={`py-3 text-left text-sm font-bold flex items-center justify-between ${
                  currentView === 'guide' ? 'text-green-400' : 'text-neutral-400'
                }`}
              >
                <span>Developer Guide</span>
                {currentView === 'guide' && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. MAIN VIEWS SWITCHER WITH PAGE-LEVEL ANIMATION & MOBILE SWIPE */}
      <main 
        className="flex-1 w-full bg-transparent overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentView}
            custom={direction}
            variants={{
              initial: (dir: number) => ({
                x: dir * 60,
                opacity: 0
              }),
              animate: {
                x: 0,
                opacity: 1
              },
              exit: (dir: number) => ({
                x: -dir * 60,
                opacity: 0
              })
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full h-full"
          >
            {currentView === 'home' && (
              <LandingView onNavigateToReview={() => navigateTo('review')} />
            )}
            
            {currentView === 'review' && (
              <ReviewView />
            )}

            {currentView === 'about' && (
              <AboutView 
                onNavigateToReview={() => navigateTo('review')} 
                onNavigateToHome={() => navigateTo('home')}
              />
            )}

            {currentView === 'guide' && (
              <GuideView />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. SOLID FOOTER (Identical across views) */}
      <footer className="bg-[#060709] border-t border-neutral-900/90 py-12 px-6 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text">
                MoveLens
              </span>
              <span className="text-neutral-600 text-xs">—</span>
              <span className="text-xs text-neutral-400 italic">Understand Every Move.</span>
            </div>
            <p className="text-[11px] text-neutral-500 max-w-md leading-relaxed">
              Free and open chess game analysis for everyone. Improve your tactical awareness and eliminate blunders without recurring premium costs or paywalls.
            </p>
          </div>

          {/* Links cluster */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500">
            <a href="#privacy" className="hover:text-blue-400 transition-colors" onClick={(e) => e.preventDefault()}>Privacy</a>
            <a href="#terms" className="hover:text-blue-400 transition-colors" onClick={(e) => e.preventDefault()}>Terms</a>
            <a href="#contact" className="hover:text-blue-400 transition-colors" onClick={(e) => e.preventDefault()}>Contact</a>
          </div>
        </div>

        {/* Community stamp */}
        <div className="max-w-7xl mx-auto text-center border-t border-neutral-900/60 mt-8 pt-6">
          <p className="text-[10px] text-neutral-600 flex items-center justify-center gap-1">
            Made with ♟️ for the global chess community
          </p>
          <p className="mt-1.5 text-[0.7rem] text-[#555] font-medium tracking-wide">
            MoveLens Version 1.0.0 (Static UI Prototype)
          </p>
        </div>
      </footer>

    </div>
  );
}
