import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      viewBox="36 30 440 440" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="vetorre_logo_grad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" /> {/* Indigo 500 */}
          <stop offset="100%" stopColor="#A855F7" /> {/* Purple 500 */}
        </linearGradient>
      </defs>
      
      {/* Left Shard */}
      <path 
        d="M96 80H196L256 280L256 460L96 80Z" 
        fill="url(#vetorre_logo_grad)" 
      />
      
      {/* Right Shard - Slightly transparent for depth */}
      <path 
        d="M416 80H316L256 280L256 460L416 80Z" 
        fill="url(#vetorre_logo_grad)"
        fillOpacity="0.9"
      />

      {/* Central Floating Core (Diamond) */}
      <path 
        d="M256 40L304 140L256 240L208 140L256 40Z" 
        fill="white"
      >
         <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite" />
         <animate attributeName="transform" values="0 0; 0 8; 0 0" dur="5s" repeatCount="indefinite" additive="sum" />
      </path>
    </svg>
  );
};

export default Logo;