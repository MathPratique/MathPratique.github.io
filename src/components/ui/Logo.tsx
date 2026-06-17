type LogoProps = {
  className?: string;
};

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-semibold ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="48" height="48" rx="12" className="fill-brand-600" />
        <path
          d="M24 10L38 36H10L24 10Z"
          stroke="#EEF2FF"
          strokeWidth="3"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="24" cy="29" r="3" className="fill-accent-500" />
      </svg>
      <span className="text-lg tracking-tight text-brand-900">MathPratique</span>
    </span>
  );
}
