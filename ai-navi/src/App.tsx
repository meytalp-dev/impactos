import { MotionConfig } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { NavigatorProvider } from './features/navigator/NavigatorProvider'
import HomePage from './pages/HomePage'
import NavigatorPage from './pages/NavigatorPage'
import PresentationPage from './pages/PresentationPage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  const location = useLocation()
  const isPresentation = location.pathname === '/presentation'

  return (
    <MotionConfig reducedMotion="user">
      <div className={`navi-app${isPresentation ? ' navi-app--presentation' : ''}`} dir="rtl">
        <a className="navi-skip-link navi-action-link" href="#main-content">דלגו לתוכן הראשי</a>
        <NavigatorProvider>
          <main id="main-content" className="navi-main" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/presentation" element={<PresentationPage />} />
              <Route path="/navigator" element={<NavigatorPage />} />
              <Route path="/results" element={<ResultsPage />} />
            </Routes>
          </main>
        </NavigatorProvider>
        {!isPresentation && (
          <aside className="navi-freshness" aria-label="הבהרת עדכניות">
            המלצות וכלים עשויים להשתנות. בדקו את המידע העדכני לפני קבלת החלטה.
          </aside>
        )}
      </div>
    </MotionConfig>
  )
}
