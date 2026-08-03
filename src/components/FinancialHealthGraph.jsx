import React, { useState } from 'react';
import { RotateCw, TrendingUp, Sparkles } from 'lucide-react';

export default function FinancialHealthGraph() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="health-card-gradient rounded-4xl p-6 text-white relative overflow-hidden flex flex-col justify-between h-full min-h-[300px] shadow-lg">
      
      {/* Background Lighting & Orbs */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-blue-300/20 rounded-full blur-xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-sm font-extrabold tracking-tight text-white/90">
            Financial health
          </h3>
          <p className="text-[11px] font-medium text-blue-100/80 mt-0.5">
            Algorithmic Score
          </p>
        </div>

        {/* Refresh Icon Button Pill */}
        <button 
          onClick={handleRefresh}
          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-all active:scale-95 shadow-sm"
          aria-label="Refresh Financial Health"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Primary Metric Display */}
      <div className="my-3 relative z-10">
        <div className="flex items-baseline space-x-2">
          <span className="text-5xl sm:text-6xl font-extrabold tracking-tight drop-shadow-sm">
            85%
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-sm border border-white/25 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Excellent
          </span>
        </div>
        <p className="text-xs font-medium text-blue-100/90 mt-1">
          since last month (+4.2%)
        </p>
      </div>

      {/* Animated Wave Curve Graph SVG */}
      <div className="relative w-full h-28 mt-2 z-10">
        
        {/* Glowing Data Nodes Labels */}
        <div className="absolute left-2 bottom-6 text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-xs">
          7.26k
        </div>
        <div className="absolute right-12 top-4 text-[10px] font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/30 shadow-md">
          16.75k
        </div>

        <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Wave Fill */}
          <path
            d="M 0,80 Q 75,95 150,50 T 300,30 L 300,100 L 0,100 Z"
            fill="url(#areaGradient)"
          />

          {/* Smooth Wave Line */}
          <path
            d="M 0,80 Q 75,95 150,50 T 300,30"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Start Node */}
          <circle cx="15" cy="78" r="4" fill="#FFFFFF" className="animate-ping opacity-75" />
          <circle cx="15" cy="78" r="4.5" fill="#FFFFFF" />

          {/* Key Peak Node (16.75k) */}
          <circle cx="235" cy="35" r="7" fill="#FFFFFF" className="animate-pulse" />
          <circle cx="235" cy="35" r="4" fill="#3B82F6" />
        </svg>
      </div>

    </div>
  );
}
