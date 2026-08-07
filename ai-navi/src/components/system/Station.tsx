import type { ButtonHTMLAttributes, HTMLAttributes, MouseEventHandler, ReactNode } from 'react'

export type StationState = 'upcoming' | 'current' | 'complete' | 'warning'

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
  const content = (
    <>
      <span className="navi-station__ring" aria-hidden="true">
        {icon ?? (index === undefined ? null : <span className="navi-station__index">{index}</span>)}
      </span>
      <span className="navi-station__label">{label}</span>
      {state === 'complete' ? <span className="navi-sr-only">הושלם</span> : null}
      {state === 'warning' ? <span className="navi-sr-only">דורש תשומת לב</span> : null}
    </>
  )
  const classes = `navi-station navi-station--${state}${asButton ? ' navi-station--button' : ''} ${className}`.trim()

  if (asButton) {
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
