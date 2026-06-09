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
          background: "#0d1a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          <polyline
            points="40,256 155,256 175,228 195,256 212,256 222,288 248,96 268,310 284,256 310,256 335,206 365,256 472,256"
            stroke="#22c55e"
            stroke-width="18"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
