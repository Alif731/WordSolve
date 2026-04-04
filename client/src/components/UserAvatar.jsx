import Avatar from "boring-avatars";

export const AVATAR_VARIANTS = [
  "beam",
  "marble",
  "pixel",
  "ring",
  "sunset",
  "bauhaus",
];

// Reusable colors for your theme
const PALETTES = {
  wizard: ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#1e1b4b"],
  // cyber: ["#10b981", "#059669", "#34d399", "#064e3b", "#020617"],
  arcade: ["#ff0055", "#00ffcc", "#3300ff", "#ffff00", "#1a1a1a"],
  nebula: ["#2d004b", "#5b0060", "#ac005d", "#e30052", "#ffffff"],
  forest: ["#365314", "#65a30d", "#bef264", "#ecfccb", "#064e3b"],
  earthy: ["#78350f", "#166534", "#ca8a04", "#fef3c7", "#451a03"],
  volt: ["#1d4ed8", "#e1ff00", "#312e81", "#14b8a6", "#0f172a"],
  candy: ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff", "#fffb96"],
  flare: ["#ef4444", "#f97316", "#facc15", "#7f1d1d", "#fff7ed"],
  titan: ["#0f172a", "#334155", "#64748b", "#94a3b8", "#f1f5f9"],
};

const UserAvatar = ({ name, variant, size = 40 }) => {
  const seed = name || "guest";

  // 1. Convert the seed string into a number
  const seedNum = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // 2. Round through the palettes
  const paletteKeys = Object.keys(PALETTES);
  const chosenKey = paletteKeys[seedNum % paletteKeys.length];
  const colors = PALETTES[chosenKey];

  const safeVariant = AVATAR_VARIANTS.includes(variant) ? variant : "beam";

  return (
    <Avatar
      size={size}
      name={seed}
      variant={safeVariant}
      colors={colors} // Automatically picks wizard, cyber, ocean, or arcade!
    />
  );
};
export default UserAvatar;
