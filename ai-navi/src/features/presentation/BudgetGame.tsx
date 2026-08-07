import { useEffect, useMemo, useState } from 'react'
import type { BudgetGameVisual } from '../../lib/presentationTypes'

type BudgetGameProps = {
  data: BudgetGameVisual
  resetToken: number
}

export function BudgetGame({ data, resetToken }: BudgetGameProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [announcement, setAnnouncement] = useState(`נותרו ${data.budget} נקודות`)
  const spent = useMemo(
    () => data.options.reduce((sum, option) => selectedIds.includes(option.id) ? sum + option.cost : sum, 0),
    [data.options, selectedIds],
  )
  const remaining = data.budget - spent
  const hasHumanReviewer = selectedIds.includes(data.humanReviewerId)

  useEffect(() => {
    setSelectedIds([])
    setRevealed(false)
    setAnnouncement(`נותרו ${data.budget} נקודות`)
  }, [data.budget, resetToken])

  const toggle = (optionId: string) => {
    const option = data.options.find((candidate) => candidate.id === optionId)
    if (!option) return
    if (selectedIds.includes(optionId)) {
      const next = selectedIds.filter((id) => id !== optionId)
      setSelectedIds(next)
      setRevealed(false)
      setAnnouncement(`נותרו ${remaining + option.cost} נקודות`)
      return
    }
    if (option.cost > remaining) {
      setAnnouncement(`לא ניתן לבחור ${option.label}: החריגה היא ${option.cost - remaining} נקודות`)
      return
    }
    setSelectedIds([...selectedIds, optionId])
    setRevealed(false)
    setAnnouncement(`נותרו ${remaining - option.cost} נקודות`)
  }

  return (
    <section className="navi-budget-game" aria-label="משחק תקציב">
      <h3>{data.prompt}</h3>
      <p className="navi-budget-game__meter">נוצלו {spent} מתוך {data.budget} · נותרו {remaining}</p>
      <div className="navi-budget-game__options" role="group" aria-label="תפקידי המסלול">
        {data.options.map((option) => {
          const selected = selectedIds.includes(option.id)
          return (
            <button key={option.id} type="button" aria-pressed={selected} onClick={() => toggle(option.id)}>
              <span>{option.label}</span>
              <strong>{option.cost} נקודות</strong>
              <small>{selected ? 'נבחר' : 'לא נבחר'}</small>
            </button>
          )
        })}
      </div>
      <p className="navi-budget-game__status" role="status" aria-live="polite">{announcement}</p>
      {!hasHumanReviewer && <p className="navi-budget-game__warning" role="alert">חסרה ביקורת אנושית במסלול</p>}
      <button
        className="navi-interaction-reveal"
        type="button"
        disabled={selectedIds.length === 0}
        onClick={() => setRevealed(true)}
      >
        חשיפת הסבר
      </button>
      {revealed && (
        <section className="navi-interaction-result" aria-live="polite">
          <h4>{data.reveal.title}</h4>
          <strong>{data.reveal.example}</strong>
          <p>{data.reveal.explanation}</p>
        </section>
      )}
    </section>
  )
}
