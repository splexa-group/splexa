const FEATURES = [
  "Hearing date reminders — never miss a date",
  "All courts and tribunals supported",
  "Client portal for sharing case updates",
  "Secure encrypted document storage",
  "Works on mobile, tablet, and desktop",
];

const TRUST_BADGES = ["🔒 256-bit SSL", "✓ BCI Aligned", "🇮🇳 Made in India"];

export function SignupPanel() {
  return (
    <div className="flex flex-col justify-between h-full px-10 py-12">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">⚖</span>
          <span className="text-[22px] font-bold text-white">Splexa</span>
        </div>

        <h2 className="text-[22px] font-bold text-white leading-snug">
          Built for Indian advocates.
          <br />
          Not adapted — built.
        </h2>

        <div className="border-t border-white/10 my-6" />

        <ul className="space-y-3">
          {FEATURES.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-[13px] text-[#bfdbfe]"
            >
              <span className="text-[#60a5fa] font-bold shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 my-6" />

        <p className="text-[13px] font-semibold text-white">
          1,200+ advocates across India
        </p>
        <p className="text-[13px] text-[#bfdbfe]">use Splexa every day.</p>
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
