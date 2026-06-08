import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#f1f1f1",
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 512 512"
          fill="none"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <g transform="translate(0, -65)">
            <path d="M 66 380 A 190 190 0 0 1 147 224 L 176 265 A 140 140 0 0 0 116 380 Z" fill="#3b82f6" />
            <path d="M 164 214 A 190 190 0 0 1 296 194 L 285 243 A 140 140 0 0 0 188 258 Z" fill="#f59e0b" />
            <path d="M 312 198 A 190 190 0 0 1 415 275 L 373 303 A 140 140 0 0 0 297 246 Z" fill="#f97316" />
            <path d="M 423 289 A 190 190 0 0 1 446 374 L 396 375 A 140 140 0 0 0 379 313 Z" fill="#ef4444" />
            <g transform="translate(256,380) rotate(50)">
              <rect x="-6" y="-125" width="12" height="172" rx="6" fill="#374151" />
              <ellipse cx="0" cy="-148" rx="22" ry="28" fill="#374151" />
              <circle cx="0" cy="0" r="16" fill="#4b5563" />
              <circle cx="0" cy="0" r="7" fill="#9ca3af" />
            </g>
          </g>
        </svg>
        {/* scale: 180/512 ≈ 0.352; labels shifted up by 65 * 0.352 ≈ 23px */}
        <div
          style={{
            position: "absolute",
            left: 15,
            top: 120,
            fontSize: 18,
            fontWeight: 700,
            color: "#22c55e",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1,
          }}
        >
          E
        </div>
        <div
          style={{
            position: "absolute",
            left: 148,
            top: 120,
            fontSize: 18,
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
