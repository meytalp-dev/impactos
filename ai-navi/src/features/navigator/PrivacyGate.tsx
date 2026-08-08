import { useEffect, useRef, useState } from 'react'
import { Notice } from '../../components/system'
import { useNavigator } from './NavigatorProvider'

export function PrivacyGate() {
  const { actions } = useNavigator()
  const [confirmed, setConfirmed] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section className="navi-navigator navi-privacy-gate" aria-labelledby="privacy-gate-title">
      <div className="navi-question-card">
        <p className="navi-navigator__eyebrow">תחנת פרטיות</p>
        <h1 id="privacy-gate-title" ref={headingRef} tabIndex={-1}>לפני שממשיכים לתוצאות</h1>
        <Notice tone="risk" title="מידע אישי או רגיש">
          אין להעלות מידע אישי או רגיש ללא הרשאה. מדיניות הארגון היא הקובעת אילו חומרים וכלים מותרים.
        </Notice>
        <label className="navi-privacy-confirmation">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          <span>קראתי והבנתי, ואבדוק הרשאה ומדיניות לפני העלאת מידע.</span>
        </label>
        <div className="navi-question-card__actions">
          <button type="button" className="navi-action navi-action--secondary" onClick={actions.back}>חזרה</button>
          <button type="button" className="navi-action navi-action--primary" disabled={!confirmed} onClick={actions.confirmPrivacy}>אישור והצגת תוצאות</button>
        </div>
      </div>
    </section>
  )
}
