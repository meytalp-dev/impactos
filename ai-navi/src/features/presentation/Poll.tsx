import { useEffect, useState } from 'react'
import type { PollOption, PollSelectionMode } from '../../lib/presentationTypes'

type PollProps = {
  ariaLabel: string
  options: PollOption[]
  selectionMode: PollSelectionMode
  resetToken: number
  showTotals?: boolean
  onSelectionChange: (selectedIds: string[]) => void
}

export function Poll({
  ariaLabel,
  options,
  selectionMode,
  resetToken,
  showTotals = false,
  onSelectionChange,
}: PollProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    setSelectedIds([])
  }, [resetToken])

  const toggle = (optionId: string) => {
    const selected = selectedIds.includes(optionId)
    const next = selectionMode === 'single'
      ? (selected ? [] : [optionId])
      : (selected ? selectedIds.filter((id) => id !== optionId) : [...selectedIds, optionId])
    setSelectedIds(next)
    onSelectionChange(next)
  }

  return (
    <div className="navi-poll" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = selectedIds.includes(option.id)
        return (
          <button
            className="navi-poll__option"
            type="button"
            key={option.id}
            aria-pressed={selected}
            onClick={() => toggle(option.id)}
          >
            <span className="navi-poll__label">{option.label}</span>
            {option.detail && <small>{option.detail}</small>}
            <span className="navi-poll__state">{selected ? 'נבחר' : 'לא נבחר'}</span>
            {showTotals && <span className="navi-poll__total">בחירה מקומית: {selected ? 1 : 0}</span>}
          </button>
        )
      })}
    </div>
  )
}
