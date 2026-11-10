// Businesses have no logo yet, so every card shows the same placeholder from the mockup.
export default function BusinessAvatar({ size = 52 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-[#ecefe9] border border-[#d4d9d3] text-[#66716c] flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none">
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
