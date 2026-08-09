import { Link } from 'react-router-dom'
import { ResultRoute } from '../features/results/ResultRoute'
import { useNavigator } from '../features/navigator/NavigatorProvider'
import { recommendRoute } from '../lib/recommendationEngine'
import type { NavigatorAnswers } from '../lib/types'

export default function ResultsPage() {
  const { answers, taskText, validation, actions } = useNavigator()

  if (!validation.complete) {
    return (
      <section className="navi-results-placeholder">
        <h1 className="navi-page-title">התוצאות שלך</h1>
        <div className="navi-results-blocked" role="alert">
          <p>צריך להשלים את הניווט לפני שאפשר להציג תוצאות.</p>
          <Link to="/navigator">חזרה לניווט</Link>
        </div>
      </section>
    )
  }

  const validatedAnswers: NavigatorAnswers = {
    taskText,
    taskTypes: answers.taskTypes,
    taskType: answers.taskTypes?.[0],
    inputTypes: answers.inputTypes,
    inputType: answers.inputTypes?.[0],
    outputType: answers.outputType,
    priorities: answers.priorities,
    priority: answers.priorities?.[0],
    timeAvailable: answers.timeAvailable,
    difficulty: answers.difficulty,
    privacy: answers.privacy,
  }
  const result = recommendRoute(validatedAnswers)

  return <ResultRoute answers={validatedAnswers} result={result} onReset={actions.reset} />
}
