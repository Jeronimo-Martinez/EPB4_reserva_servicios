import FieldError from "./FieldError";

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  maxLength?: number;
  rows?: number;
}

export default function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  maxLength,
  rows = 3,
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label
        className="text-[#18211e] text-[14px] font-medium leading-[20px]"
        style={{ fontFamily: '"Inter:Medium", sans-serif' }}
      >
        {label}
      </label>
      <textarea
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full border rounded-[8px] px-4 py-[10px] text-[14px] bg-white outline-none transition-colors resize-none text-[#18211e]
          ${error ? "border-[#d94f41] focus:border-[#d94f41]" : "border-[#d4d9d3] focus:border-[#005146]"}`}
        style={{ fontFamily: '"Inter:Regular", sans-serif' }}
      />
      <div className="flex items-start justify-between gap-2">
        <div>
          {error && <FieldError msg={error} />}
          {hint && !error && (
            <p
              className="text-[#66716c] text-[12px]"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              {hint}
            </p>
          )}
        </div>
        {maxLength && (
          <p
            className="text-[#66716c] text-[12px] shrink-0"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
