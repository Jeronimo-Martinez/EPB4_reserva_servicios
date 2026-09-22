interface SuccessBannerProps {
  title: string;
  description?: string;
  onDismiss?: () => void;
}

export default function SuccessBanner({ title, description, onDismiss }: SuccessBannerProps) {
  return (
    <div className="flex items-start gap-3 bg-[#e6f0ef] border border-[#b8d4d1] rounded-[10px] px-5 py-4">
      <div className="w-7 h-7 rounded-full bg-[#005146] flex items-center justify-center shrink-0 mt-0.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12l5 5L19 7"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex-1">
        <p
          className="text-[#18211e] text-[14px] font-semibold leading-[20px]"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          {title}
        </p>
        {description && (
          <p
            className="text-[#66716c] text-[13px] leading-[19px] mt-0.5"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            {description}
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[#66716c] hover:text-[#18211e] transition-colors mt-0.5"
          aria-label="Cerrar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
