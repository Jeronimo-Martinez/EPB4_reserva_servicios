interface RatingBadgeProps {
  average: number;
  count: number;
  /** "124 reseñas" en lugar de "124". */
  long?: boolean;
}

export default function RatingBadge({ average, count, long }: RatingBadgeProps) {
  if (!count) {
    return <span className="text-[12px] text-[#66716c]">Sin reseñas aún</span>;
  }
  return (
    <span className="flex items-center gap-1 text-[13px] font-semibold text-[#18211e]">
      <span className="text-amber-500" aria-hidden="true">★</span>
      <span>{average.toFixed(1)}</span>
      <span className="text-[#66716c] text-[12px] font-normal">({long ? `${count} reseñas` : count})</span>
    </span>
  );
}
