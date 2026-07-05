type Props = {
  className?: string;
  /** When true, the wordmark uses cream text (for navy backgrounds) */
  light?: boolean;
};

/**
 * The Tavoria wordmark — "Tavoria." with the leading T in orange.
 * Serif, weight 700, tracking-tight. The period stays in the base color.
 */
export default function Wordmark({ className = "", light }: Props) {
  return (
    <span
      className={`font-serif font-bold tracking-tight leading-none ${
        light ? "text-cream" : "text-navy"
      } ${className}`}
    >
      <span className="text-orange">T</span>avoria
      <span className={light ? "text-cream" : "text-navy"}>.</span>
    </span>
  );
}
