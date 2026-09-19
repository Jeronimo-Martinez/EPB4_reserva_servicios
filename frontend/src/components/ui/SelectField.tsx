import FieldError from "./FieldError";

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  hint,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label
        className="text-[#18211e] text-[14px] font-medium leading-[20px]"
        style={{ fontFamily: '"Inter:Medium", sans-serif' }}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none border rounded-[8px] px-4 py-[10px] text-[14px] bg-white outline-none transition-colors pr-9
            ${error ? "border-[#d94f41]" : "border-[#d4d9d3] focus:border-[#005146]"}
            ${value ? "text-[#18211e]" : "text-[#9eaaa5]"}`}
          style={{ fontFamily: '"Inter:Regular", sans-serif' }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="#66716c"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {error && <FieldError msg={error} />}
      {hint && !error && (
        <p
          className="text-[#66716c] text-[12px] leading-[16px]"
          style={{ fontFamily: '"Inter:Regular", sans-serif' }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
