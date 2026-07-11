// Brand/social icons are no longer bundled with lucide-react (removed for
// trademark reasons in newer versions), so we provide minimal inline SVG
// equivalents here with the same `className` prop contract as lucide icons.
type IconProps = { className?: string }

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  )
}

export function TwitterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 3H21l-6.55 7.49L22.17 21h-6.05l-4.74-6.2L5.94 21H3.8l7.01-8.01L2 3h6.2l4.28 5.66L18.9 3zm-1.06 16.2h1.13L7.28 4.72H6.06l11.78 14.48z" />
    </svg>
  )
}
