import type { HTMLAttributes, ReactNode } from 'react'

export type StatusKind = 'fit' | 'check' | 'risk' | 'info' | 'creative'

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status: StatusKind
  children: ReactNode
}

const statusLabels: Record<StatusKind, string> = {
  fit: 'מתאים',
  check: 'לבדיקה',
  risk: 'סיכון',
  info: 'מידע',
  creative: 'יצירתי',
}

export function StatusBadge({ status, children, className = '', ...props }: StatusBadgeProps) {
  return (
    <span className={`navi-status-badge navi-status-badge--${status} ${className}`.trim()} {...props}>
      <span className="navi-status-badge__label">{statusLabels[status]}</span>
      <span className="navi-status-badge__content">{children}</span>
    </span>
  )
}
