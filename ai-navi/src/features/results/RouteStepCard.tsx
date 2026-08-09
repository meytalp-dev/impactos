import { aiTools } from '../../data/tools'
import type { RecommendedStep } from '../../lib/recommendationEngine'

const toolById = (id: string) => aiTools.find((tool) => tool.id === id)
const inputLabels: Record<string, string> = {
  none: 'אין חומר גלם',
  idea: 'רעיון',
  'short-text': 'טקסט קצר',
  text: 'טקסט',
  document: 'מסמך',
  documents: 'כמה מסמכים',
  data: 'נתונים',
  image: 'תמונה',
  audio: 'אודיו',
  video: 'וידאו',
  'web-links': 'קישורים או אתרים',
}

interface RouteStepCardProps {
  index: number
  step: RecommendedStep
  sensitive: boolean
}

export function RouteStepCard({ index, step, sensitive }: RouteStepCardProps) {
  const primary = step.primaryToolId ? toolById(step.primaryToolId) : undefined
  const alternatives = step.alternativeToolIds.map(toolById).filter((tool) => tool !== undefined)
  const titleId = `result-step-${index + 1}`

  return (
    <article className="navi-route-step" data-route-step aria-labelledby={titleId}>
      <header className="navi-route-step__heading">
        <span className="navi-route-step__number">שלב {index + 1}</span>
        <div>
          <p>תפקיד: {step.role}</p>
          <h2 id={titleId}>
            {sensitive ? 'כלי מאושר בארגון' : primary ? <span data-primary-tool={primary.id}>{primary.name}</span> : 'בחירת כלי מתאימה'}
          </h2>
        </div>
      </header>

      <dl className="navi-route-step__details">
        <div><dt>למה מתאים</dt><dd>{step.whyFit}</dd></div>
        <div><dt>מה לספק</dt><dd>{inputLabels[step.input] ?? step.input}</dd></div>
        <div><dt>התוצר הצפוי</dt><dd>{step.output}</dd></div>
        <div><dt>מה ה-AI עושה</dt><dd>{step.whatAiDoes}</dd></div>
        <div><dt>מה נשאר באחריותך</dt><dd>{step.whatHumanDoes}</dd></div>
        <div><dt>מה לבדוק</dt><dd>{step.whatToCheck}</dd></div>
      </dl>

      <div className="navi-route-step__alternatives">
        <h3>כלים חלופיים לשלב</h3>
        {sensitive ? (
          <p>בחרו חלופה רק מתוך רשימת הכלים המאושרים בארגון.</p>
        ) : alternatives.length ? (
          <ul>{alternatives.map((tool) => <li key={tool.id}>{tool.name}</li>)}</ul>
        ) : (
          <p>אין חלופה בטוחה נוספת בקטלוג למסלול הזה.</p>
        )}
      </div>
    </article>
  )
}
