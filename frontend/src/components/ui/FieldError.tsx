export default function FieldError({ msg }: { msg: string }) {
  return (
    <p
      className="text-[#d94f41] text-[12px] leading-[16px] flex items-center gap-1"
      style={{ fontFamily: '"Inter:Regular", sans-serif' }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.5" stroke="#d94f41" />
        <path d="M6 3.5v3M6 8h.01" stroke="#d94f41" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {msg}
    </p>
  );
}
