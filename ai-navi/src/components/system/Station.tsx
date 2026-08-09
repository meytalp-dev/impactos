import type { ButtonHTMLAttributes, HTMLAttributes, MouseEventHandler, ReactNode } from 'react'

export type StationState = 'upcoming' | 'current' | 'complete' | 'warning'

const stateLabels: Record<StationState, string> = {
  upcoming: 'בהמשך',
  current: 'נוכחי',
  complete: 'הושלם',
  warning: 'דורש תשומת לב',
}

type StationProps = {
  label: string
  index?: number
  state?: StationState
  icon?: ReactNode
  asButton?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  ariaLabel?: string
  ariaCurrent?: 'step'
  className?: string
}

export function Station({
  label,
  index,
  state = 'upcoming',
  icon,
  asButton = false,
  onClick,
  ariaLabel,
  ariaCurrent,
  className = '',
}: StationProps) {
  const interactive = asButton || Boolean(onClick)
  const content = (
    <>
      <span className="navi-station__ring" aria-hidden="true">
        {icon ?? (index === undefined ? null : <span className="navi-station__index">{index}</span>)}
      </span>
      <span className="navi-station__label">{label}</span>
      <span className="navi-station__state-label">{stateLabels[state]}</span>
    </>
  )
  const classes = `navi-station navi-station--${state}${interactive ? ' navi-station--button' : ''} ${className}`.trim()

  if (interactive) {
    const buttonProps: ButtonHTMLAttributes<HTMLButtonElement> = {
      type: 'button',
      className: classes,
      onClick,
      'aria-label': ariaLabel,
      'aria-current': ariaCurrent,
    }
    return <button {...buttonProps}>{content}</button>
  }

  const stationProps: HTMLAttributes<HTMLDivElement> = {
    className: classes,
    'aria-label': ariaLabel,
    'aria-current': ariaCurrent,
  }
  return <div {...stationProps}>{content}</div>
}
