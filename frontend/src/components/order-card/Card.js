import React from 'react';

const Card = ({ title, Icon, quantity, className }) => {
  // Map incoming classes to translucent accents with high-contrast text
  const colorMap = {
    red: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400' },
    orange: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
    amber: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
    indigo: { bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-400' },
    store: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
    emerald: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
  };

  const colorMatch = className?.match(/text-(\w+)-/);
  const colorKey = colorMatch ? colorMatch[1] : 'store';
  const colors = colorMap[colorKey] || { bg: 'bg-neutral-800 border-neutral-700', text: 'text-neutral-300' };

  return (
    <div className="flex h-full group">
      <div className="flex items-center w-full bg-transparent p-5 rounded-2xl border border-neutral-800/80 transition-all duration-300 hover:border-[#D4A359]/40 hover:bg-white/[0.02] shadow-sm">
        <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border ${colors.bg} ${colors.text}`}>
          <Icon className="text-xl sm:text-2xl" />
        </div>
        <div className="ml-4 sm:ml-5 min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 truncate">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {quantity || 0}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default Card;
