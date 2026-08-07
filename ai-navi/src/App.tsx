import { ArrowLeft } from 'lucide-react'
import { MotionConfig, motion } from 'framer-motion'
import { Link, Route, Routes } from 'react-router-dom'

const routeContent = {
  presentation: 'בניית מצגת',
  navigator: 'התחלת ניווט',
  results: 'התוצאות שלך',
} as const

function PlaceholderPage({ title }: { title: string }) {
  return <h1 className="navi-page-title">{title}</h1>
}

function HomePage() {
  return (
    <motion.section
      className="navi-home"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="navi-kicker">מרחב לחשיבה עם בינה מלאכותית</p>
      <h1>AI NAVI</h1>
      <p className="navi-promise">לא מתחילים בכלי. מתחילים במשימה.</p>
      <p className="navi-audience">מתאים לחינוך, ניהול, יזמות, שיווק ולכל משימה כללית.</p>
      <nav className="navi-destinations" aria-label="יעדים ראשיים">
        <Link className="navi-primary-link navi-route-peach" to="/presentation">
          למצגת <ArrowLeft aria-hidden="true" size={20} strokeWidth={2.5} />
        </Link>
        <Link className="navi-primary-link navi-route-sage" to="/navigator">
          להתחלת ניווט <ArrowLeft aria-hidden="true" size={20} strokeWidth={2.5} />
        </Link>
      </nav>
    </motion.section>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="navi-app" dir="rtl">
        <a className="navi-skip-link" href="#main-content">דלגו לתוכן הראשי</a>
        <main id="main-content" className="navi-main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/presentation" element={<PlaceholderPage title={routeContent.presentation} />} />
            <Route path="/navigator" element={<PlaceholderPage title={routeContent.navigator} />} />
            <Route path="/results" element={<PlaceholderPage title={routeContent.results} />} />
          </Routes>
        </main>
        <aside className="navi-freshness" aria-label="הבהרת עדכניות">
          המלצות וכלים עשויים להשתנות. בדקו את המידע העדכני לפני קבלת החלטה.
        </aside>
      </div>
    </MotionConfig>
  )
}
