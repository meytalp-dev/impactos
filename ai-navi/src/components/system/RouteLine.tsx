import type { HTMLAttributes } from 'react'

export type RouteTone = 'teal' | 'blue' | 'sage' | 'lavender' | 'peach' | 'mustard'

type RouteLineProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: RouteTone
  direction?: 'horizontal' | 'vertical'
  active?: boolean
}

export function RouteLine({
  tone = 'teal',
  direction = 'horizontal',
  active = false,
  className = '',
  ...props
}: RouteLineProps) {
  return (
    <span
      className={`navi-route-line navi-route-line--${tone} navi-route-line--${direction}${active ? ' is-active' : ''} ${className}`.trim()}
      data-testid="route-line"
      {...props}
      aria-hidden="true"
    />
  )
}
