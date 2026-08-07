import type { SlideDefinition } from '../../lib/presentationTypes'

type PresenterNotesProps = {
  slide: SlideDefinition
  slides: SlideDefinition[]
  currentIndex: number
  elapsedSeconds: number
  nextSlide?: SlideDefinition
  onJump: (index: number) => void
  onReset: () => void
  onClose: () => void
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

export function PresenterNotes({
  slide,
  slides,
  currentIndex,
  elapsedSeconds,
  nextSlide,
  onJump,
  onReset,
  onClose,
}: PresenterNotesProps) {
  return (
    <aside className="navi-presenter-notes" aria-label="הערות מרצה">
      <header className="navi-presenter-notes__header">
        <div>
          <p>תצוגת מרצה</p>
          <span className="navi-presenter-notes__position">שקופית {currentIndex + 1} מתוך {slides.length}</span>
          <h2>{slide.title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="סגירת הערות מרצה">×</button>
      </header>

      <div className="navi-presenter-notes__metrics">
        <div><span>זמן במצגת</span><strong>{formatDuration(elapsedSeconds)}</strong></div>
        <div><span>משך מומלץ</span><strong>משך מומלץ: {formatDuration(slide.duration)}</strong></div>
      </div>

      <section aria-labelledby="presenter-notes-title">
        <h3 id="presenter-notes-title">מה לומר עכשיו</h3>
        <ul>{slide.speakerNotes.map((note) => <li key={note}>{note}</li>)}</ul>
      </section>

      <section className="navi-presenter-notes__next" aria-labelledby="presenter-next-title">
        <h3 id="presenter-next-title">תצוגה מקדימה</h3>
        <p>{nextSlide ? `הבא: ${nextSlide.title}` : 'זו השקופית האחרונה'}</p>
      </section>

      <div className="navi-presenter-notes__actions">
        <label>
          <span>מעבר לשקופית</span>
          <select value={currentIndex} onChange={(event) => onJump(Number(event.target.value))} aria-label="מעבר לשקופית">
            {slides.map((candidate, index) => (
              <option key={candidate.id} value={index}>{index + 1}. {candidate.title}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onReset}>איפוס האינטראקציה בשקופית</button>
      </div>
    </aside>
  )
}
