import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, colorClass, trendText }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
            {value}
          </h3>
        </div>
        <div className={`rounded-xl p-3 text-white ${colorClass || 'gradient-bg'} shadow-sm`}>
          {icon}
        </div>
      </div>
      {trendText && (
        <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-brand-500 mr-1">✦</span>
          <span>{trendText}</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
