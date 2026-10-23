import React from "react";

/**
 * The auth-screen illustration: grounded in what Veritas actually does
 * (a live queue position, an AI-predicted wait, and a verified trust
 * score) rather than a generic stock "doctor" graphic. Pure inline SVG,
 * no external image dependency.
 */
export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 560 640" className="w-full h-full" role="img" aria-label="">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B3760" />
          <stop offset="100%" stopColor="#14538C" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2B7CB8" />
          <stop offset="100%" stopColor="#14538C" />
        </linearGradient>
      </defs>

      <rect width="560" height="640" fill="url(#bgGrad)" />

      {/* soft ambient rings */}
      <circle cx="440" cy="90" r="140" fill="#ffffff" opacity="0.04" />
      <circle cx="60" cy="560" r="180" fill="#ffffff" opacity="0.04" />

      {/* central trust badge -- the product's core idea, front and center */}
      <g transform="translate(280,235)">
        <circle r="108" fill="#ffffff" opacity="0.06" />
        <circle r="82" fill="none" stroke="#C9962E" strokeWidth="6" opacity="0.9" />
        <circle r="82" fill="none" stroke="#ffffff" strokeWidth="6" strokeDasharray="12 500" opacity="0" />
        <path d="M -30 4 L -8 28 L 34 -26" fill="none" stroke="#F6EBD4" strokeWidth="9"
              strokeLinecap="round" strokeLinejoin="round" />
        <text x="0" y="118" textAnchor="middle" fill="#DCE9F5" fontSize="16" fontFamily="Manrope, sans-serif" fontWeight="600">
          Verified trust score
        </text>
      </g>

      {/* floating queue-position card */}
      <g transform="translate(60,120)">
        <rect width="168" height="92" rx="16" fill="url(#cardGrad)" stroke="#ffffff" strokeOpacity="0.15" />
        <text x="20" y="34" fill="#DCE9F5" fontSize="12" fontFamily="Manrope, sans-serif" opacity="0.85">Queue position</text>
        <text x="20" y="70" fill="#ffffff" fontSize="34" fontFamily="Poppins, sans-serif" fontWeight="700">2</text>
        <text x="60" y="70" fill="#DCE9F5" fontSize="12" fontFamily="Manrope, sans-serif" opacity="0.85">ahead of you</text>
      </g>

      {/* floating wait-time card */}
      <g transform="translate(340,410)">
        <rect width="180" height="92" rx="16" fill="#ffffff" opacity="0.95" />
        <text x="20" y="34" fill="#5C6B78" fontSize="12" fontFamily="Manrope, sans-serif">AI-predicted wait</text>
        <text x="20" y="70" fill="#0B3760" fontSize="30" fontFamily="Poppins, sans-serif" fontWeight="700">14</text>
        <text x="56" y="70" fill="#5C6B78" fontSize="13" fontFamily="Manrope, sans-serif">min</text>
      </g>

      {/* verified review chip */}
      <g transform="translate(90,470)">
        <rect width="196" height="64" rx="14" fill="#ffffff" opacity="0.95" />
        <circle cx="30" cy="32" r="14" fill="#DCE9F5" />
        <path d="M23 32 l5 5 l10 -11" fill="none" stroke="#14538C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="54" y="27" fill="#16202B" fontSize="12.5" fontFamily="Manrope, sans-serif" fontWeight="600">Verified visit</text>
        <text x="54" y="45" fill="#C9962E" fontSize="13" fontFamily="Manrope, sans-serif">★★★★★</text>
      </g>

      {/* connecting lines suggesting live data flow, subtle */}
      <path d="M228 165 C 260 190, 260 210, 280 235" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" fill="none" />
      <path d="M340 300 C 370 340, 390 370, 400 410" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" fill="none" />

      <text x="280" y="600" textAnchor="middle" fill="#DCE9F5" fontSize="15" fontFamily="Manrope, sans-serif" opacity="0.75">
        Real-time queues. Verified reviews. One clinic app.
      </text>
    </svg>
  );
}
