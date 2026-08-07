import { Link } from 'react-router-dom'
import { NaviLogo, RouteLine, Station, StatusBadge } from '../components/system'

const junctions = [
  'משימה',
  'חומר גלם',
  'תוצר',
  'עדיפויות',
  'מעורבות',
  'כלי או מסלול',
]

const contexts = ['חינוך', 'ניהול', 'יזמות', 'שיווק', 'שימוש כללי']

const destinations = [
  {
    to: '/presentation',
    label: 'למצגת האינטראקטיבית',
    title: 'מסלול מצגת',
    description: 'בנו סיפור, מבנה ותחנות לקהל שלכם — לפני בחירת כלי העיצוב.',
    tone: 'peach' as const,
  },
  {
    to: '/navigator',
    label: 'להתחלת ניווט אישי',
    title: 'ניווט אישי',
    description: 'קבלו מסלול עבודה שמתאים למשימה, לחומר ולרמת המעורבות הרצויה.',
    tone: 'sage' as const,
  },
]

export default function HomePage() {
  return (
    <section className="navi-gateway" aria-labelledby="gateway-promise">
      <header className="navi-gateway__masthead">
        <NaviLogo />
        <StatusBadge status="info">תחנת פתיחה</StatusBadge>
      </header>

      <div className="navi-gateway__intro">
        <p className="navi-gateway__eyebrow">מפת החלטה לעבודה עם בינה מלאכותית</p>
        <h1 id="gateway-promise">לא מתחילים בכלי. מתחילים במשימה.</h1>
        <p className="navi-gateway__explanation">
          מתחילים במשימה, בחומר הגלם, בתוצר הרצוי ובמגבלות — ורק אז בוחרים כלי או מסלול.
        </p>
      </div>

      <section className="navi-gateway__destinations" aria-labelledby="gateway-destinations-title">
        <div className="navi-gateway__section-heading">
          <p>שתי דרכי יציאה</p>
          <h2 id="gateway-destinations-title">לאן נוסעים מכאן?</h2>
        </div>
        <div className="navi-gateway__destination-grid">
          {destinations.map((destination, index) => (
            <article className={`navi-gateway__destination navi-gateway__destination--${destination.tone}`} key={destination.to}>
              <div className="navi-gateway__destination-route" aria-hidden="true">
                <RouteLine tone={destination.tone} active />
                <span className="navi-gateway__destination-stop">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3>{destination.title}</h3>
              <p>{destination.description}</p>
              <Link className="navi-gateway__destination-link" to={destination.to} aria-label={destination.label}>
                <span>{destination.label}</span>
                <span aria-hidden="true">←</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="navi-gateway__junctions" aria-labelledby="gateway-junctions-title">
        <div className="navi-gateway__section-heading">
          <p>קו ההחלטה</p>
          <h2 id="gateway-junctions-title">שש תחנות לפני בחירה</h2>
        </div>
        <ol className="navi-gateway__junction-list">
          {junctions.map((label, index) => (
            <li key={label}>
              <Station label={label} index={index + 1} state={index === 0 ? 'current' : 'upcoming'} />
              {index < junctions.length - 1 && <RouteLine tone={index % 2 === 0 ? 'blue' : 'teal'} active />}
            </li>
          ))}
        </ol>
      </section>

      <section className="navi-gateway__contexts" aria-labelledby="gateway-contexts-title">
        <div>
          <p className="navi-gateway__eyebrow">אותה מפה, הקשרים שונים</p>
          <h2 id="gateway-contexts-title">חשיבה שמתאימה לעבודה שלכם</h2>
        </div>
        <ul aria-label="הקשרים לדוגמה">
          {contexts.map((context) => <li key={context}>{context}</li>)}
        </ul>
      </section>
    </section>
  )
}
