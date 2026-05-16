const BULLETS = [
  "Never miss a hearing date again",
  "All courts and tribunals supported",
  "1,200+ advocates trust Splexa daily",
];

const TRUST_BADGES = ["🔒 256-bit SSL", "✓ BCI Aligned", "🇮🇳 Made in India"];

export function LoginPanel() {
  return (
    <div className="flex flex-col justify-between h-full px-10 py-12">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">⚖</span>
          <span className="text-[22px] font-bold text-white">Splexa</span>
        </div>

        <h2 className="text-[22px] font-bold text-white leading-snug">
          Welcome back.
          <br />
          Your practice is waiting.
        </h2>

        <div className="border-t border-white/10 my-6" />

        <ul className="space-y-3">
          {BULLETS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-[13px] text-[#bfdbfe]"
            >
              <span className="text-[#60a5fa] font-bold">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 my-6" />

        <blockquote className="text-[13px] text-[#bfdbfe] leading-relaxed">
          "Splexa has saved me hours every week. Hearing reminders alone are
          worth it."
        </blockquote>
        <p className="text-[13px] text-[#93c5fd] mt-2 font-medium">
          — Adv. Ramesh Iyer, Chennai
        </p>
      </div>

      {/* Trust badges */}
      <div className="flex gap-5 flex-wrap">
        {TRUST_BADGES.map((badge) => (
          <span key={badge} className="text-[11px] font-medium text-[#bfdbfe]">
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
