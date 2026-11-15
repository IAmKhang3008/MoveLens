import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Menu, X, Eye, HelpCircle, Globe } from 'lucide-react';
import LandingView from './components/LandingView';
import ReviewView from './components/ReviewView';
import AboutView from './components/AboutView';
import GuideView from './components/GuideView';
import TermsEn from './components/TermsEn';
import TermsVi from './components/TermsVi';
import TermsJa from './components/TermsJa';
import TermsCn from './components/TermsCn';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'review' | 'about' | 'guide' | 'terms'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [direction, setDirection] = useState<number>(1);
  const [termsLanguage, setTermsLanguage] = useState<'en' | 'vi' | 'ja' | 'cn'>('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
 // 1 = forward (sliding left), -1 = backward (sliding right)

  // Refs for tracking swipe gestures on mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipeBlockedRef = useRef<boolean>(false);

  // Simple handler to switch page views
  const navigateTo = (view: 'home' | 'review' | 'about' | 'guide' | 'terms') => {
    const views: ('home' | 'review' | 'about' | 'guide' | 'terms')[] = ['home', 'review', 'about', 'guide', 'terms'];
    const fromIndex = views.indexOf(currentView);
    const toIndex = views.indexOf(view);
    
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      setDirection(toIndex > fromIndex ? 1 : -1);
    }
    
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    setIsProfilePopoverOpen(false);
    setIsLangDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      target.closest('[data-no-page-swipe], canvas, pre, code, input, textarea, select, .cg-wrap')
    ) {
      isSwipeBlockedRef.current = true;
      touchStartRef.current = null;
      touchEndRef.current = null;
      return;
    }

    isSwipeBlockedRef.current = false;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSwipeBlockedRef.current || !touchStartRef.current) return;
    const touch = e.touches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    if (isSwipeBlockedRef.current || !touchStartRef.current || !touchEndRef.current) {
      isSwipeBlockedRef.current = false;
      touchStartRef.current = null;
      touchEndRef.current = null;
      return;
    }

    const diffX = touchEndRef.current.x - touchStartRef.current.x;
    const diffY = touchEndRef.current.y - touchStartRef.current.y;

    const minSwipeDistance = 75; // minimum pixels to count as intentional page swipe
    const isHorizontal = Math.abs(diffX) > Math.abs(diffY) * 1.75;

    if (isHorizontal && Math.abs(diffX) > minSwipeDistance) {
      const views: ('home' | 'review' | 'about' | 'guide')[] = ['home', 'review', 'about', 'guide'];
      const currentIndex = views.indexOf(currentView as any);

      if (currentIndex !== -1) {
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
    }

    // Reset coordinates
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white font-sans flex flex-col justify-between selection:bg-green-500/30 selection:text-green-300">
      
      {/* 1. STICKY HEADER (56px on mobile to stay well under 15% sticky viewport cap) */}
      <header className="sticky top-0 z-50 bg-[#0B0C10]/90 backdrop-blur-md border-b border-neutral-900/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 md:h-20 flex items-center justify-between gap-4">
          
          {/* Logo with blue-to-green gradient and lens icon */}
          <button 
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 group transition-transform active:scale-95 min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="MoveLens Home"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-green-500 flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:rotate-6 transition-transform duration-300">
              <Search className="w-4 h-4 md:w-4.5 md:h-4.5 text-neutral-950 stroke-[3]" />
            </div>
            <span className="text-lg md:text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-green-400 text-transparent bg-clip-text">
              MoveLens
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigateTo('home')}
              className={`text-sm font-semibold tracking-wide transition-colors relative py-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
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
              className={`text-sm font-semibold tracking-wide transition-colors relative py-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
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
              className={`text-sm font-semibold tracking-wide transition-colors relative py-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
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
              className={`text-sm font-semibold tracking-wide transition-colors relative py-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'guide' 
                  ? 'text-green-400' 
                  : 'text-neutral-400 hover:text-blue-400'
              }`}
            >
              Guide
              {currentView === 'guide' && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </nav>

          {/* Right Header Controls (Language selector on Terms, Offline profile badge & Mobile toggle) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentView === 'terms' && (
              <div className="relative">
                <button 
                  onClick={() => {
                    setIsLangDropdownOpen(!isLangDropdownOpen);
                    setIsProfilePopoverOpen(false);
                  }}
                  className="min-h-[44px] px-2.5 py-2 rounded-xl text-neutral-300 hover:text-white bg-neutral-900/70 hover:bg-neutral-800 border border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  aria-label="Select Terms Language"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">{termsLanguage}</span>
                </button>
                <AnimatePresence>
                  {isLangDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsLangDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-40 bg-[#13151A] border border-neutral-800 rounded-xl shadow-2xl py-1.5 z-50 origin-top-right"
                      >
                        <button 
                          onClick={() => { setTermsLanguage('en'); setIsLangDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 min-h-[44px] text-sm flex items-center gap-2 hover:bg-neutral-800/80 transition-colors cursor-pointer ${termsLanguage === 'en' ? 'text-white font-bold' : 'text-neutral-400'}`}
                        >
                          <span className="text-lg leading-none">🇬🇧</span> English
                        </button>
                        <button 
                          onClick={() => { setTermsLanguage('vi'); setIsLangDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 min-h-[44px] text-sm flex items-center gap-2 hover:bg-neutral-800/80 transition-colors cursor-pointer ${termsLanguage === 'vi' ? 'text-white font-bold' : 'text-neutral-400'}`}
                        >
                          <span className="text-lg leading-none">🇻🇳</span> Vietnamese
                        </button>
                        <button 
                          onClick={() => { setTermsLanguage('ja'); setIsLangDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 min-h-[44px] text-sm flex items-center gap-2 hover:bg-neutral-800/80 transition-colors cursor-pointer ${termsLanguage === 'ja' ? 'text-white font-bold' : 'text-neutral-400'}`}
                        >
                          <span className="text-lg leading-none">🇯🇵</span> Japanese
                        </button>
                        <button 
                          onClick={() => { setTermsLanguage('cn'); setIsLangDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 min-h-[44px] text-sm flex items-center gap-2 hover:bg-neutral-800/80 transition-colors cursor-pointer ${termsLanguage === 'cn' ? 'text-white font-bold' : 'text-neutral-400'}`}
                        >
                          <span className="text-lg leading-none">🇨🇳</span> Chinese
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User profile avatar badge — tap-toggleable on mobile + hover on desktop */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfilePopoverOpen(!isProfilePopoverOpen);
                  setIsLangDropdownOpen(false);
                }}
                className="w-11 h-11 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-[#2C2C2C] to-[#3A3A3A] border border-neutral-700/60 flex items-center justify-center cursor-pointer shadow-inner group focus-visible:outline-2 focus-visible:outline-green-400"
                title="Offline Mode (No login required)"
                aria-label="Offline mode information"
                aria-expanded={isProfilePopoverOpen}
              >
                <span className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors font-mono">
                  GM
                </span>
                
                {/* Desktop hover tooltip */}
                <span className="hidden md:block pointer-events-none absolute right-0 top-11 scale-0 group-hover:scale-100 transition-all duration-150 origin-top-right bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
                  Offline Mode (No login required)
                </span>
              </button>

              {/* Mobile / Tap Popover */}
              <AnimatePresence>
                {isProfilePopoverOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfilePopoverOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="md:hidden absolute right-0 top-12 bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-semibold px-3 py-2 rounded-xl whitespace-nowrap shadow-2xl z-50"
                    >
                      Offline Mode · No login required
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu hamburger toggle button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsProfilePopoverOpen(false);
              }}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
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
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 top-14 bg-black/60 backdrop-blur-xs z-30"
              />
              <motion.div 
                className="md:hidden absolute top-14 left-0 right-0 bg-[#0B0C10] border-b border-neutral-850 shadow-2xl flex flex-col p-4 gap-1 z-40 max-h-[calc(100dvh-3.5rem)] overflow-y-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => navigateTo('home')}
                  className={`min-h-[48px] px-3 py-3 rounded-xl text-left text-sm font-bold flex items-center justify-between transition-colors ${
                    currentView === 'home' ? 'bg-green-500/10 text-green-400' : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <span>Home</span>
                  {currentView === 'home' && <span className="text-[11px] font-mono uppercase tracking-wider">Active</span>}
                </button>
                
                <button
                  onClick={() => navigateTo('review')}
                  className={`min-h-[48px] px-3 py-3 rounded-xl text-left text-sm font-bold flex items-center justify-between transition-colors ${
                    currentView === 'review' ? 'bg-green-500/10 text-green-400' : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <span>Review</span>
                  {currentView === 'review' && <span className="text-[11px] font-mono uppercase tracking-wider">Active</span>}
                </button>

                <button
                  onClick={() => navigateTo('about')}
                  className={`min-h-[48px] px-3 py-3 rounded-xl text-left text-sm font-bold flex items-center justify-between transition-colors ${
                    currentView === 'about' ? 'bg-green-500/10 text-green-400' : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <span>About</span>
                  {currentView === 'about' && <span className="text-[11px] font-mono uppercase tracking-wider">Active</span>}
                </button>

                <button
                  onClick={() => navigateTo('guide')}
                  className={`min-h-[48px] px-3 py-3 rounded-xl text-left text-sm font-bold flex items-center justify-between transition-colors ${
                    currentView === 'guide' ? 'bg-green-500/10 text-green-400' : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <span>Guide</span>
                  {currentView === 'guide' && <span className="text-[11px] font-mono uppercase tracking-wider">Active</span>}
                </button>

                <button
                  onClick={() => navigateTo('terms')}
                  className={`min-h-[48px] px-3 py-3 rounded-xl text-left text-sm font-bold flex items-center justify-between transition-colors border-t border-neutral-900 mt-1 pt-3 ${
                    currentView === 'terms' ? 'bg-green-500/10 text-green-400' : 'text-neutral-400 hover:bg-neutral-900'
                  }`}
                >
                  <span>Terms</span>
                  {currentView === 'terms' && <span className="text-[11px] font-mono uppercase tracking-wider">Active</span>}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* 2. MAIN VIEWS SWITCHER WITH PAGE-LEVEL ANIMATION & SAFE MOBILE SWIPE */}
      <main 
        className="flex-1 w-full bg-transparent overflow-x-clip touch-pan-y"
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

            {currentView === 'terms' && (
              termsLanguage === 'en' ? <TermsEn /> : termsLanguage === 'vi' ? <TermsVi /> : termsLanguage === 'ja' ? <TermsJa /> : <TermsCn />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. SOLID FOOTER (Identical across views) */}
      <footer className="bg-[#060709] border-t border-neutral-900/90 py-12 px-4 md:px-6 lg:px-8 shrink-0">
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
            <a href="#terms" className="hover:text-blue-400 transition-colors" onClick={(e) => { e.preventDefault(); navigateTo('terms'); }}>Terms</a>
            <a href="mailto:movelens@proton.me" className="hover:text-blue-400 transition-colors">Contact</a>
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
