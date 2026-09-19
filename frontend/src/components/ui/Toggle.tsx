interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

export default function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p
          className="text-[#18211e] text-[14px] font-medium leading-[20px]"
          style={{ fontFamily: '"Inter:Medium", sans-serif' }}
        >
          {label}
        </p>
        {description && (
          <p
            className="text-[#66716c] text-[12px] leading-[18px] mt-0.5"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none mt-0.5
          ${checked ? "bg-[#005146]" : "bg-[#d4d9d3]"}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
