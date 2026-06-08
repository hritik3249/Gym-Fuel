import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 104,
          background: "#f1f1f1",
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          width="512"
          height="512"
          viewBox="0 0 512 512"
          fill="none"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Blue segment */}
          <path d="M 66 380 A 190 190 0 0 1 147 224 L 176 265 A 140 140 0 0 0 116 380 Z" fill="#3b82f6" />
          {/* Amber segment */}
          <path d="M 164 214 A 190 190 0 0 1 296 194 L 285 243 A 140 140 0 0 0 188 258 Z" fill="#f59e0b" />
          {/* Orange segment */}
          <path d="M 312 198 A 190 190 0 0 1 415 275 L 373 303 A 140 140 0 0 0 297 246 Z" fill="#f97316" />
          {/* Red segment */}
          <path d="M 423 289 A 190 190 0 0 1 446 374 L 396 375 A 140 140 0 0 0 379 313 Z" fill="#ef4444" />
          {/* Spoon needle */}
          <g transform="translate(256,380) rotate(50)">
            <rect x="-6" y="-125" width="12" height="172" rx="6" fill="#374151" />
            <ellipse cx="0" cy="-148" rx="22" ry="28" fill="#374151" />
            <circle cx="0" cy="0" r="16" fill="#4b5563" />
            <circle cx="0" cy="0" r="7" fill="#9ca3af" />
          </g>
        </svg>
        {/* E label — absolute, left side */}
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 406,
            fontSize: 50,
            fontWeight: 700,
            color: "#22c55e",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1,
          }}
        >
          E
        </div>
        {/* F label — absolute, right side */}
        <div
          style={{
            position: "absolute",
            left: 421,
            top: 406,
            fontSize: 50,
            fontWeight: 700,
            color: "#ef4444",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1,
          }}
        >
          F
        </div>
      </div>
    ),
    { ...size }
  );
}
