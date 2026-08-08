import type { HTMLAttributes } from 'react'
import { RouteLine } from './RouteLine'
import { Station } from './Station'

type ProgressStep = {
  id: string
  label: string
}

type ProgressPathProps = HTMLAttributes<HTMLElement> & {
  steps: ProgressStep[]
  currentIndex: number
  onStepSelect?: (index: number, step: ProgressStep) => void
  canSelectStep?: (index: number, step: ProgressStep) => boolean
}

export function ProgressPath({ steps, currentIndex, onStepSelect, canSelectStep, className = '', ...props }: ProgressPathProps) {
  const safeCurrentIndex = steps.length === 0 ? -1 : Math.max(0, Math.min(currentIndex, steps.length - 1))
  const announcement = safeCurrentIndex === -1 ? 'אין שלבים' : `שלב ${safeCurrentIndex + 1} מתוך ${steps.length}`

  return (
    <nav className={`navi-progress-path ${className}`.trim()} aria-label="התקדמות במסלול" {...props}>
      <p className="navi-sr-only" aria-live="polite">{announcement}</p>
      <ol className="navi-progress-path__steps">
        {steps.map((step, index) => {
          const isCurrent = index === safeCurrentIndex
          const state = index < safeCurrentIndex ? 'complete' : isCurrent ? 'current' : 'upcoming'
          const isSelectable = Boolean(onStepSelect) && (canSelectStep?.(index, step) ?? true)
          const station = (
            <Station
              label={step.label}
              index={index + 1}
              state={state}
              asButton={isSelectable}
              onClick={isSelectable && onStepSelect ? () => onStepSelect(index, step) : undefined}
              ariaLabel={`${step.label}, שלב ${index + 1} מתוך ${steps.length}`}
              ariaCurrent={isCurrent ? 'step' : undefined}
            />
          )

          return (
            <li className="navi-progress-path__step" key={step.id}>
              {station}
              {index < steps.length - 1 ? <RouteLine active={index < safeCurrentIndex} /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
