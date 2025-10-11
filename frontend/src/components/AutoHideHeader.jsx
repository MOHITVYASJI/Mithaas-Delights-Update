import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';

/**
 * Auto-Hide Header Wrapper
 * Features:
 * - Hides on scroll down
 * - Shows on scroll up
 * - Auto-hides after 3 seconds of no movement
 * - Always shows hamburger menu button
 */
export const AutoHideHeader = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hideTimeoutRef = useRef(null);
  const scrollThreshold = 10; // Minimum scroll distance to trigger

  useEffect(() => {
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY) < scrollThreshold) {
        ticking = false;
        return;
      }

      // Show on scroll up, hide on scroll down (but not at very top)
      if (scrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
        resetHideTimer();
      } else if (scrollY > 100 && scrollY > lastScrollY) {
        // Scrolling down (and not at top)
        setIsVisible(false);
        clearHideTimer();
      }

      setLastScrollY(scrollY);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    // Auto-hide after 3 seconds of no scroll
    const resetHideTimer = () => {
      clearHideTimer();
      hideTimeoutRef.current = setTimeout(() => {
        if (window.scrollY > 100) {
          setIsVisible(false);
        }
      }, 3000); // 3 seconds
    };

    const clearHideTimer = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    // Show header on mouse move (optional, uncomment if needed)
    const onMouseMove = () => {
      setIsVisible(true);
      resetHideTimer();
    };

    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouseMove);

    // Initial timer
    resetHideTimer();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      clearHideTimer();
    };
  }, [lastScrollY]);

  return (
    <>
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed top-0 left-0 right-0 z-50 ${className}`}
      >
        {/* Header content */}
        {children}

        {/* Mobile Menu Button - Always visible on mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed top-4 right-4 z-[60] p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300"
          aria-label="Toggle mobile menu"
          data-testid="mobile-menu-toggle"
        >
          <Menu className="w-6 h-6" />
        </button>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 bg-white z-[55] pt-20 px-6 overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Mobile navigation links */}
            <nav className="flex flex-col space-y-6">
              <a
                href="/"
                className="text-xl font-semibold text-gray-800 hover:text-orange-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/#products"
                className="text-xl font-semibold text-gray-800 hover:text-orange-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </a>
              <a
                href="/#about"
                className="text-xl font-semibold text-gray-800 hover:text-orange-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a
                href="/#contact"
                className="text-xl font-semibold text-gray-800 hover:text-orange-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <a
                href="/bulk-orders"
                className="text-xl font-semibold text-gray-800 hover:text-orange-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bulk Orders
              </a>
              <a
                href="/gallery"
                className="text-xl font-semibold text-gray-800 hover:text-orange-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gallery
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AutoHideHeader;
