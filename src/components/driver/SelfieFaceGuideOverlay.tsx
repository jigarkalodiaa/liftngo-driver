/** Blue dashed head & shoulders guide over the camera preview */
export default function SelfieFaceGuideOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full text-[#2563EB]"
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden
    >
      <ellipse
        cx="100"
        cy="88"
        rx="48"
        ry="58"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="6 5"
      />
      <path
        d="M52 155c12-28 28-38 48-38s36 10 48 38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="6 5"
        strokeLinecap="round"
      />
    </svg>
  );
}
