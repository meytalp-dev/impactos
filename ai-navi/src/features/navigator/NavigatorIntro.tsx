import { useState, type CSSProperties } from 'react'
import { NaviLogo } from '../../components/system'
import { useNavigator } from './NavigatorProvider'

const examples = ['מסמך למצגת', 'ניתוח שאלון', 'סרטון פתיחה', 'פעילות לתלמידים', 'סיכום כמה מסמכים', 'כלי דיגיטלי']

export function NavigatorIntro() {
  const { taskText, validation, actions } = useNavigator()
  const [draft, setDraft] = useState(taskText)

  return (
    <section className="navi-navigator navi-navigator--intro" aria-labelledby="navigator-intro-title">
      <header className="navi-navigator__brand"><NaviLogo /></header>
      <div className="navi-intro-card">
        <p className="navi-navigator__eyebrow">ניווט אישי בשבע תחנות</p>
        <h1 id="navigator-intro-title">מה המשימה שלך היום?</h1>
        <p className="navi-intro-card__lead">כתבי את המטרה כמו שהיית מסבירה לאדם אחר. לא צריך להכיר שמות של כלים.</p>
        <label className="navi-task-field">
          <span>המשימה שלי</span>
          <textarea
            value={draft}
            placeholder="תארי בשפה פשוטה מה את רוצה לעשות"
            rows={4}
            enterKeyHint="next"
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <div className="navi-examples" aria-hidden="true">
          <span>למשל:</span>
          <span className="navi-examples__rotator">
            {examples.map((example, index) => <span key={example} style={{ '--example-index': index } as CSSProperties}>{example}</span>)}
          </span>
        </div>
        <ul className="navi-sr-only" aria-label="דוגמאות למשימות">
          {examples.map((example) => <li key={example}>{example}</li>)}
        </ul>
        {validation.message ? <p className="navi-validation" role="status" aria-live="polite">{validation.message}</p> : null}
        <button type="button" className="navi-action navi-action--primary" disabled={!draft.trim()} onClick={() => actions.start(draft)}>
          התחלת ניווט
        </button>
      </div>
    </section>
  )
}
