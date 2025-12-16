
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface AdUnitProps {
  format?: 'horizontal' | 'rectangle' | 'vertical';
  className?: string;
  slot?: string; // Explicit AdSense slot id override
  adLayout?: 'rspv' | 'mcrspv' | 'auto'; // Layout hint (amp auto-format values)
}

const AdUnit: React.FC<AdUnitProps> = ({ format = 'horizontal', className = '', slot, adLayout = 'auto' }) => {
  const location = useLocation();
  
  // Environment-provided slots
  const envSlots = typeof import.meta !== 'undefined'
    ? {
        default: (import.meta as any).env?.VITE_ADSENSE_SLOT,
        rspv: (import.meta as any).env?.VITE_ADSENSE_SLOT_RSPV,
        mcrspv: (import.meta as any).env?.VITE_ADSENSE_SLOT_MCRSPV,
      }
    : { default: undefined, rspv: undefined, mcrspv: undefined };

  // Choose slot precedence: explicit prop > layout-specific env > default env
  const adSlot = slot || (adLayout !== 'auto' ? envSlots[adLayout] : undefined) || envSlots.default;
  const adRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 1. Exclude Admin Panel Logic
  // If we are in the admin route, do not render any ad markup
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    if (!adSlot) return; // No slot -> keep placeholder
    
    const loadAd = () => {
      try {
        // @ts-ignore - Push ad to AdSense queue
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setLoaded(true);
      } catch (e) {
        console.error('AdSense error:', e);
        setLoaded(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadAd, 100);
    return () => clearTimeout(timer);
  }, [adSlot, location.pathname]);

  const getReservedHeight = () => {
    if (format === 'vertical') return 600;
    if (format === 'rectangle') return 300;
    return 280; // horizontal / default
  };

  const reservedHeight = getReservedHeight();

  // 2. Adjust Layout for Visibility
  // Use a container that centers content and handles max-width nicely for different screens
  const containerClasses = `w-full max-w-[1200px] mx-auto my-8 px-4 sm:px-0 flex flex-col items-center justify-center overflow-hidden ${className}`;

  // If we have an ad slot, render real AdSense unit with reserved height to avoid CLS
  if (adSlot) {
    return (
      <div className={containerClasses} style={{ minHeight: reservedHeight + 30 }}>
        <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 w-full text-center">Advertisement</div>
        <div className="w-full flex justify-center bg-zinc-900/20 rounded-lg overflow-hidden">
            {/* @ts-ignore */}
            <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', maxWidth: '100%', minWidth: '300px', height: reservedHeight }}
            data-ad-client="ca-pub-9054863881104831"
            data-ad-slot={String(adSlot)}
            data-ad-format={adLayout === 'auto' ? 'auto' : null}
            data-full-width-responsive="true"
            ref={adRef as any}
            />
        </div>
      </div>
    );
  }

  // Fallback placeholder if no slot configured (Demo Mode)
  return (
    <div className={containerClasses}>
      <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 w-full text-center">Advertisement</div>
      <div 
        className={`w-full max-w-4xl min-h-[200px] sm:min-h-[250px] bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:bg-zinc-900 transition-colors`}
        title="AdSense Placeholder"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-zinc-900/10 z-0"></div>
        <div className="z-10 text-center p-6">
          <span className="text-zinc-500 font-bold text-xs block mb-2 tracking-wide">SPONSORED</span>
          <span className="text-zinc-300 font-medium text-base block mb-3">Unlock Premium AI Tools</span>
          <p className="text-zinc-500 text-xs max-w-xs mx-auto mb-4 hidden sm:block">Support VETORRE by checking out our partners.</p>
          <button className="bg-indigo-600/10 text-indigo-400 text-xs px-4 py-2 rounded-full border border-indigo-600/20 hover:bg-indigo-600 hover:text-white transition-all">
            Learn More
          </button>
        </div>
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 bg-zinc-800 rounded text-[9px] flex items-center justify-center text-zinc-500">i</div>
        </div>
      </div>
      {!loaded && (
        <div className="text-[10px] text-zinc-600 mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
          Set VITE_ADSENSE_SLOT to enable real ads
        </div>
      )}
    </div>
  );
};

export default AdUnit;
