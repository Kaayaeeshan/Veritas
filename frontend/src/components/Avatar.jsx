import React from "react";

// A small, fixed set of gradient pairs, all drawn from the app's own blue
// and gold palette plus close neighbours -- so avatars vary from person to
// person without ever clashing with the theme or needing a real photo.
const GRADIENTS = [
  ["#14538C", "#2B7CB8"], // primary blue
  ["#0B3760", "#2B4A6B"], // deep navy
  ["#B8862E", "#D9AF5C"], // gold
  ["#1E7A8C", "#4FC3D4"], // bright teal
  ["#3B4C82", "#6E7FB8"], // indigo
  ["#1B5E4F", "#3E9C82"], // teal-green
];

function hashName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Gradient-tinted initials avatar. Deterministic per name (same person
 * always gets the same gradient), used everywhere a doctor, patient, or
 * account initial is shown, instead of a single flat-color circle.
 */
export default function Avatar({ name, size = 44, className = "", textClassName = "" }) {
  const [from, to] = GRADIENTS[hashName(name || "") % GRADIENTS.length];
  const fontSize = Math.round(size * 0.38);
  return (
    <div
      className={`flex-shrink-0 rounded-xl flex items-center justify-center font-display font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      <span className={textClassName}>{initials(name)}</span>
    </div>
  );
}
