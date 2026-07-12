/**
 * Standard "SmartzConnect" wordmark — always rendered as a single pink→purple
 * gradient across the whole word (never split into a gradient half + plain
 * half). Reuses the shared `.text-gradient-love` utility (src/index.css) so
 * every usage stays visually identical and themeable from one place.
 */
export default function BrandName({ className = '' }: { className?: string }) {
  return <span className={`text-gradient-love ${className}`}>SmartzConnect</span>
}
