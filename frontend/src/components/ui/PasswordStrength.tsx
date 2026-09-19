const CHECKS = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Una letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un número", test: (p: string) => /[0-9]/.test(p) },
  { label: "Un carácter especial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const results = CHECKS.map((c) => ({ ...c, ok: c.test(password) }));
  const passed = results.filter((c) => c.ok).length;
  const barColor =
    passed <= 1 ? "bg-[#d94f41]" : passed <= 2 ? "bg-[#e8a44a]" : "bg-[#005146]";

  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < passed ? barColor : "bg-[#d4d9d3]"}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {results.map((c) => (
          <p
            key={c.label}
            className="text-[12px] flex items-center gap-1"
            style={{
              fontFamily: '"Inter:Regular", sans-serif',
              color: c.ok ? "#005146" : "#66716c",
            }}
          >
            {c.ok ? "✓" : "○"} {c.label}
          </p>
        ))}
      </div>
    </div>
  );
}
