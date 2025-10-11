import React from 'react';
import { motion } from 'framer-motion';
import './HeroVideo.css';

/**
 * GIF/Video-based Hero Background
 * Usage: Replace Hero3DBackground with this component
 * Supports both GIF and video formats
 */
export const HeroGIFBackground = ({ 
  gifPath = '/hero-animation.gif',
  opacity = 0.3,
  blend = 'normal' // Options: 'normal', 'multiply', 'screen', 'overlay'
}) => {
  const isVideo = gifPath.toLowerCase().endsWith('.mp4') || gifPath.toLowerCase().endsWith('.webm');
  const videoRef = React.useRef(null);

  // Ensure video plays on mobile
  React.useEffect(() => {
    if (videoRef.current && isVideo) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay failed, retrying...', err);
        // Retry after user interaction
        setTimeout(() => {
          videoRef.current?.play().catch(() => {});
        }, 1000);
      });
    }
  }, [isVideo]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Main GIF/Video Background */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: opacity }}
        transition={{ duration: 1 }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={gifPath}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            webkit-playsinline="true"
            x5-playsinline="true"
            x-webkit-airplay="allow"
            crossOrigin="anonymous"
            className="w-full h-full object-cover mobile-video-fix"
            style={{
              mixBlendMode: blend,
              filter: 'brightness(0.9) contrast(1.1)',
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)',
            }}
            onLoadedData={() => {
              // Force play when video is loaded
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
            onCanPlay={() => {
              // Additional play trigger for mobile
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
          />
        ) : (
          <img
            src={gifPath}
            alt="Background Animation"
            className="w-full h-full object-cover"
            loading="eager"
            style={{
              mixBlendMode: blend,
              filter: 'brightness(0.9) contrast(1.1)',
            }}
          />
        )}
      </motion.div>

      {/* Optional: Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/80 dark:via-gray-900/50 dark:to-gray-900/80" />
    </div>
  );
};

export default HeroGIFBackground;
