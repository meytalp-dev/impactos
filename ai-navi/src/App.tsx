import { MotionConfig } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PresentationPage from './pages/PresentationPage'

const routeContent = {
  navigator: 'התחלת ניווט',
  results: 'התוצאות שלך',
} as const

function PlaceholderPage({ title }: { title: string }) {
  return <h1 className="navi-page-title">{title}</h1>
}

export default function App() {
  const location = useLocation()
  const isPresentation = location.pathname === '/presentation'

  return (
    <MotionConfig reducedMotion="user">
      <div className={`navi-app${isPresentation ? ' navi-app--presentation' : ''}`} dir="rtl">
        <a className="navi-skip-link" href="#main-content">דלגו לתוכן הראשי</a>
        <main id="main-content" className="navi-main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/presentation" element={<PresentationPage />} />
            <Route path="/navigator" element={<PlaceholderPage title={routeContent.navigator} />} />
            <Route path="/results" element={<PlaceholderPage title={routeContent.results} />} />
          </Routes>
        </main>
        {!isPresentation && (
          <aside className="navi-freshness" aria-label="הבהרת עדכניות">
            המלצות וכלים עשויים להשתנות. בדקו את המידע העדכני לפני קבלת החלטה.
          </aside>
        )}
      </div>
    </MotionConfig>
  )
}
