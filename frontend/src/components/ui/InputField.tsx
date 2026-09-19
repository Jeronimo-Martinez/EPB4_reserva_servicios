import FieldError from "./FieldError";

interface InputFieldProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  type?: string;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  trailing?: React.ReactNode;
}

export default function InputField({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  type = "text",
  prefix,
  suffix,
  disabled,
  trailing,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between">
        <label
          className="text-[#18211e] text-[14px] font-medium leading-[20px]"
          style={{ fontFamily: '"Inter:Medium", sans-serif' }}
        >
          {label}
        </label>
        {trailing}
      </div>
      <div className="relative flex items-center">
        {prefix && (
          <span
            className="absolute left-4 text-[#66716c] text-[14px] select-none"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full border rounded-[8px] py-[10px] text-[14px] outline-none transition-colors
            ${prefix ? "pl-8 pr-4" : suffix ? "pl-4 pr-10" : "px-4"}
            ${
              disabled
                ? "bg-[#f2f3ee] text-[#66716c] border-[#d4d9d3] cursor-not-allowed"
                : error
                ? "bg-white text-[#18211e] border-[#d94f41] focus:border-[#d94f41]"
                : "bg-white text-[#18211e] border-[#d4d9d3] focus:border-[#005146]"
            }`}
          style={{ fontFamily: '"Inter:Regular", sans-serif' }}
        />
        {suffix && (
          <span
            className="absolute right-4 text-[#66716c] text-[13px] select-none"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            {suffix}
          </span>
        )}
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
