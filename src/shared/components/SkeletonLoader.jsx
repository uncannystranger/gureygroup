import React from 'react';

export function SkeletonBase({ className = '' }) {
  return (
    <div 
      className={`bg-slate-200/80 dark:bg-slate-800/80 animate-pulse rounded-2xl ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBase className="w-24 h-4 rounded-lg" />
            <SkeletonBase className="w-9 h-9 rounded-xl" />
          </div>
          <SkeletonBase className="w-32 h-8 rounded-xl" />
          <div className="flex items-center space-x-2 pt-1">
            <SkeletonBase className="w-16 h-3 rounded-md" />
            <SkeletonBase className="w-20 h-3 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="glass-panel rounded-3xl p-4 overflow-hidden space-y-4">
      <div className="flex justify-between items-center pb-2">
        <SkeletonBase className="w-36 h-6 rounded-xl" />
        <SkeletonBase className="w-24 h-8 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between space-x-4 py-2 border-b border-slate-200/40 dark:border-slate-800/40">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBase key={c} className={`h-4 rounded-lg ${c === 0 ? 'w-32 sm:w-48' : 'w-16 sm:w-24'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel p-4 rounded-3xl space-y-3">
          <SkeletonBase className="w-full h-44 rounded-2xl" />
          <SkeletonBase className="w-3/4 h-5 rounded-lg" />
          <SkeletonBase className="w-1/2 h-4 rounded-lg" />
          <div className="flex items-center justify-between pt-2">
            <SkeletonBase className="w-20 h-6 rounded-lg" />
            <SkeletonBase className="w-16 h-8 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4">
      <div className="flex justify-between items-center">
        <SkeletonBase className="w-40 h-6 rounded-xl" />
        <SkeletonBase className="w-24 h-8 rounded-xl" />
      </div>
      <div className="h-64 flex items-end justify-between space-x-3 pt-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBase key={i} className="w-full rounded-t-xl" style={{ height: `${20 + (i * 12) % 70}%` }} />
        ))}
      </div>
    </div>
  );
}

export default {
  CardSkeleton,
  TableSkeleton,
  ProductGridSkeleton,
  ChartSkeleton,
  SkeletonBase
};
