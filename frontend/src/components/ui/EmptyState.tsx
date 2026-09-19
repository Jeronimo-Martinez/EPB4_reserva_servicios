import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  variant?: 'card' | 'dashed' | 'simple';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  variant = 'card',
  className = '',
}) => {
  const containerClasses = {
    card: 'bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-8 sm:p-12 text-center shadow-xs',
    dashed: 'bg-[#fcfcf8] border-2 border-dashed border-[#d4d9d3] rounded-[14px] p-8 sm:p-12 text-center',
    simple: 'py-12 text-center',
  }[variant];

  return (
    <div className={`${containerClasses} ${className} animate-fade-in`}>
      {icon ? (
        <div className="w-16 h-16 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center mx-auto mb-4 shrink-0 shadow-2xs">
          {icon}
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center mx-auto mb-4 shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <h3 className="text-[18px] font-bold text-[#18211e] leading-snug">
        {title}
      </h3>
      <p className="text-[#66716c] text-[14px] mt-2 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center gap-2 bg-[#005146] hover:bg-[#00403b] text-white px-5 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-98"
            >
              {actionText}
            </button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-gray-100 text-[#18211e] border border-[#d4d9d3] px-5 py-2.5 rounded-[8px] text-[14px] font-semibold transition-colors cursor-pointer"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
