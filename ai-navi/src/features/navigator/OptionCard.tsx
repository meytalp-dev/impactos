import type { NavigatorOptionValue } from '../../data/questions'

interface OptionCardProps {
  label: string
  value: NavigatorOptionValue
  selected: boolean
  onSelect: (value: NavigatorOptionValue) => void
}

export function OptionCard({ label, value, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      className={`navi-option-card${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(value)}
    >
      <span className="navi-option-card__marker" aria-hidden="true">{selected ? '✓' : ''}</span>
      <span>{label}</span>
    </button>
  )
}
