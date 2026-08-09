import { Link } from 'react-router-dom'
import type { RecommendationResult } from '../../lib/recommendationEngine'
import { hasStrictPrivacyRequirement } from '../../lib/scoring'
import type { NavigatorAnswers } from '../../lib/types'
import { AlternativeRouteCard } from './AlternativeRouteCard'
import { PrivacyWarning } from './PrivacyWarning'
import { PromptCard } from './PromptCard'
import { RouteStepCard } from './RouteStepCard'

const freshnessNotice = 'המלצות וכלים עשויים להשתנות. בדקו את המידע העדכני לפני קבלת החלטה.'

interface ResultRouteProps {
  answers: NavigatorAnswers
  result: RecommendationResult
  onReset: () => void
}

export function ResultRoute({ answers, result, onReset }: ResultRouteProps) {
  const sensitive = hasStrictPrivacyRequirement(answers.privacy)
  const generatedAt = new Date()
  const generatedDate = new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(generatedAt)
  const warnings = [...new Set([
    freshnessNotice,
    ...result.warnings,
    ...result.humanChecks,
    'בדקו שהתוצר בעברית ברור, טבעי ומתאים לקהל לפני שימוש.',
    ...(answers.taskType === 'research' || answers.priorities?.includes('sources')
      ? ['פתחו את המקורות המקוריים ובדקו מחבר, תאריך והקשר.']
      : []),
  ])]

  return (
    <article className="navi-results" data-result-route={result.routeId}>
      <header className="navi-results__header">
        <p className="navi-results__eyebrow">מסלול עבודה, לא דירוג כלים</p>
        <h1>המסלול המומלץ עבורך</h1>
        <p className="navi-results__summary"><strong>המשימה שלך:</strong> {result.taskSummary}</p>
        <div className="navi-print-only navi-results__print-title" aria-hidden="true">
          <strong>AI NAVI — המסלול המומלץ</strong>
          <span>תאריך הפקה: <time dateTime={generatedAt.toISOString()}>{generatedDate}</time></span>
        </div>
      </header>

      <nav className="navi-route-diagram" aria-label="תרשים המסלול המומלץ">
        <div className="navi-route-diagram__endpoint"><span>קלט</span><strong>{result.steps[0]?.input ?? 'חומר הגלם שלך'}</strong></div>
        {result.steps.map((step, index) => (
          <div className="navi-route-diagram__stage" key={`${step.role}-${index}`}>
            <span aria-hidden="true" className="navi-route-diagram__connector">←</span>
            <span>שלב {index + 1}</span>
            <strong>{step.role}</strong>
          </div>
        ))}
        <div className="navi-route-diagram__endpoint">
          <span aria-hidden="true" className="navi-route-diagram__connector">←</span>
          <span>תוצר</span><strong>{result.steps.at(-1)?.output ?? 'תוצר לבדיקה'}</strong>
        </div>
      </nav>

      <section className="navi-route-steps" aria-label="שלבי המסלול">
        {result.steps.map((step, index) => (
          <RouteStepCard key={`${step.role}-${index}`} index={index} step={step} sensitive={sensitive} />
        ))}
      </section>

      <section className="navi-alternatives" aria-labelledby="alternative-routes-title">
        <div className="navi-results__section-heading">
          <p className="navi-results__eyebrow">אפשר לבחור דרך אחרת</p>
          <h2 id="alternative-routes-title">שלוש חלופות משמעותיות</h2>
        </div>
        <div className="navi-alternatives__grid">
          <AlternativeRouteCard kind="fast" toolIds={result.alternatives.fast} sensitive={sensitive} />
          <AlternativeRouteCard kind="professional" toolIds={result.alternatives.professional} sensitive={sensitive} />
          <AlternativeRouteCard kind="budget" toolIds={result.alternatives.budget} sensitive={sensitive} />
        </div>
      </section>

      <section className="navi-result-warnings" role="region" aria-label="אזהרות ובדיקות לפני שימוש">
        <div className="navi-results__section-heading">
          <p className="navi-results__eyebrow">לפני שמתחילים</p>
          <h2>אזהרות ובדיקות</h2>
        </div>
        {sensitive ? <PrivacyWarning /> : null}
        <ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
      </section>

      <PromptCard prompt={result.prompt} />

      <footer className="navi-results-actions" aria-label="פעולות לתוצאה">
        <Link className="navi-action navi-action--secondary" to="/navigator">שינוי תשובה</Link>
        <button type="button" className="navi-action navi-action--secondary" onClick={onReset}>ניווט חדש</button>
        <button type="button" className="navi-action navi-action--primary" onClick={() => window.print?.()}>הדפסה / שמירה כ־PDF</button>
        <Link className="navi-action navi-action--secondary" to="/presentation">פתיחת מצב מצגת</Link>
      </footer>
    </article>
  )
}
