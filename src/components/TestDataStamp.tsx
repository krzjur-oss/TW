import React from 'react';

export const TestDataStamp: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/60 dark:text-amber-200 whitespace-nowrap shrink-0 ${className}`}
    >
      DANE TESTOWE
    </span>
  );
};
