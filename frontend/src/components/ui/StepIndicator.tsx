interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number; // 1-indexed
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-7">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors
                ${done || active ? "bg-[#005146] text-white" : "bg-[#d4d9d3] text-[#66716c]"}`}
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              {done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l5 5L19 7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            <span
              className={`text-[13px] font-medium hidden sm:inline ${
                active ? "text-[#18211e]" : "text-[#66716c]"
              }`}
              style={{ fontFamily: '"Inter:Medium", sans-serif' }}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-10 h-px mx-1 ${done ? "bg-[#005146]" : "bg-[#d4d9d3]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
