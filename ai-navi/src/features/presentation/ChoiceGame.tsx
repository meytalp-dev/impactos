import { useEffect, useState } from 'react'
import type { ChoiceGameVisual } from '../../lib/presentationTypes'
import { Poll } from './Poll'

type ChoiceGameProps = {
  data: ChoiceGameVisual
  resetToken: number
}

export function ChoiceGame({ data, resetToken }: ChoiceGameProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setSelectedIds([])
    setRevealed(false)
  }, [resetToken])

  const hasUnsafeSelection = data.unsafeOptionIds?.some((id) => selectedIds.includes(id)) ?? false
  const isCorrect = data.correctOptionIds
    ? selectedIds.length === data.correctOptionIds.length
      && data.correctOptionIds.every((id) => selectedIds.includes(id))
    : !hasUnsafeSelection

  return (
    <section className="navi-choice-game" aria-label="משחק החלטה">
      <h3>{data.prompt}</h3>
      <Poll
        ariaLabel="אפשרויות לבחירה"
        options={data.options}
        selectionMode={data.selectionMode}
        resetToken={resetToken}
        showTotals={revealed}
        onSelectionChange={(ids) => {
          setSelectedIds(ids)
          setRevealed(false)
        }}
      />
      {data.disclaimer && <p className="navi-choice-game__disclaimer">{data.disclaimer}</p>}
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
          <strong>
            {hasUnsafeSelection
              ? 'הבחירה כוללת מסלול שאינו בטוח אוטומטית'
              : isCorrect ? 'בחירה מתאימה' : 'כדאי לבחור מסלול אחר'}
          </strong>
          <p>{data.reveal.explanation}</p>
          {data.reveal.humanChecks && (
            <ul>{data.reveal.humanChecks.map((check) => <li key={check}>{check}</li>)}</ul>
          )}
        </section>
      )}
    </section>
  )
}
