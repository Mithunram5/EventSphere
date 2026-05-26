import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm animate-pulse">
      <div className="h-48 w-full rounded-xl bg-slate-200 dark:bg-slate-800 mb-4"></div>
      <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800 mb-2"></div>
      <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-800 mb-4"></div>
      <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800 mb-2"></div>
      <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800 mb-4"></div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-8 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-8 w-1/4 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </div>
  );
};

export const ListSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
          <div className="h-20 w-20 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
};
