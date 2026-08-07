import type { HTMLAttributes } from 'react'

type NaviLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean
}

export function NaviLogo({ compact = false, className = '', ...props }: NaviLogoProps) {
  return (
    <div className={`navi-logo${compact ? ' navi-logo--compact' : ''} ${className}`.trim()} {...props}>
      <svg className="navi-logo__mark" viewBox="0 0 54 32" aria-hidden="true" focusable="false">
        <path d="M7 24 27 8l20 16" />
        <circle cx="7" cy="24" r="4.5" />
        <circle cx="27" cy="8" r="4.5" />
        <circle cx="47" cy="24" r="4.5" />
      </svg>
      <span className="navi-logo__wordmark" dir="ltr">AI NAVI</span>
    </div>
  )
}
