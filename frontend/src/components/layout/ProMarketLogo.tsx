export default function ProMarketLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
        <path d="M10 0L0 6v12h4.5V10.5h11V18H20V6L10 0z" fill="#005146" />
      </svg>
      <span
        className="text-[#005146] text-[24px] font-bold leading-[32px]"
        style={{
          fontFamily: '"DM Sans:Bold", sans-serif',
          fontVariationSettings: '"opsz" 14',
        }}
      >
        ProMarket
      </span>
    </div>
  );
}
