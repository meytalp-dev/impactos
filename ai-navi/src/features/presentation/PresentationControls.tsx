type PresentationControlsProps = {
  currentIndex: number
  total: number
  notesOpen: boolean
  hasPendingReveals: boolean
  onPrevious: () => void
  onNext: () => void
  onToggleNotes: () => void
  onFullscreen: () => void
}

export function PresentationControls({
  currentIndex,
  total,
  notesOpen,
  hasPendingReveals,
  onPrevious,
  onNext,
  onToggleNotes,
  onFullscreen,
}: PresentationControlsProps) {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0

  return (
    <nav className="navi-presentation-controls" aria-label="פקדי מצגת">
      <div className="navi-presentation-controls__nav">
        <button type="button" onClick={onPrevious} disabled={currentIndex === 0} aria-label="לשקופית הקודמת">
          <span aria-hidden="true">→</span>
          <span>הקודמת</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentIndex === total - 1 && !hasPendingReveals}
          aria-label={hasPendingReveals ? 'חשיפה הבאה' : 'לשקופית הבאה'}
        >
          <span>{hasPendingReveals ? 'חשיפה' : 'הבאה'}</span>
          <span aria-hidden="true">←</span>
        </button>
      </div>

      <div className="navi-presentation-progress" aria-label="התקדמות במצגת">
        <span>{currentIndex + 1} מתוך {total}</span>
        <span className="navi-presentation-progress__track" aria-hidden="true">
          <span style={{ inlineSize: `${progress}%` }} />
        </span>
      </div>

      <div className="navi-presentation-controls__tools">
        <button type="button" onClick={onToggleNotes} aria-label={notesOpen ? 'הסתרת הערות מרצה' : 'הצגת הערות מרצה'} aria-pressed={notesOpen}>
          הערות <kbd>N</kbd>
        </button>
        <button type="button" onClick={onFullscreen} aria-label="מעבר למסך מלא">
          מסך מלא <kbd>F</kbd>
        </button>
      </div>
    </nav>
  )
}
