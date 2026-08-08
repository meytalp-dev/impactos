import { useEffect, useRef } from 'react'
import { Notice, ProgressPath } from '../../components/system'
import { navigatorQuestions } from '../../data/questions'
import { OptionCard } from './OptionCard'
import { isStepAnswered, useNavigator } from './NavigatorProvider'

export function QuestionStep() {
  const { currentStep, answers, validation, actions } = useNavigator()
  const question = navigatorQuestions[currentStep]
  const headingRef = useRef<HTMLHeadingElement>(null)
  const selected = question.selection === 'multiple'
    ? (answers[question.id] as string[] | undefined) ?? []
    : [answers[question.id] as string | undefined].filter(Boolean)

  useEffect(() => {
    headingRef.current?.focus()
  }, [currentStep])

  return (
    <section className="navi-navigator" aria-labelledby={`navigator-question-${currentStep}`}>
      <header className="navi-navigator__topbar">
        <span>AI NAVI</span>
        <button type="button" className="navi-text-action" onClick={actions.reset}>איפוס הניווט</button>
      </header>
      <ProgressPath
        steps={navigatorQuestions.map(({ id, progressLabel }) => ({ id, label: progressLabel }))}
        currentIndex={currentStep}
        onStepSelect={actions.edit}
        canSelectStep={(index) => index < currentStep && isStepAnswered(answers, index)}
      />
      <div className="navi-question-card">
        <p className="navi-navigator__eyebrow">תחנה {currentStep + 1}</p>
        <h1 id={`navigator-question-${currentStep}`} ref={headingRef} tabIndex={-1}>{question.title}</h1>
        <p className="navi-question-card__reason">{question.reason}</p>
        <div className="navi-option-grid" role="group" aria-label={question.title}>
          {question.options.map((option) => (
            <OptionCard
              key={option.value}
              {...option}
              selected={selected.includes(option.value)}
              onSelect={(value) => actions.select(question.id, value)}
            />
          ))}
        </div>
        {validation.message ? <p className="navi-validation" role="status" aria-live="polite">{validation.message}</p> : null}
        {question.id === 'privacy' && answers.privacy === 'maybe' ? (
          <Notice tone="warning" title="כדאי לבדוק לפני שמעלים חומר">ייתכן שיש מידע רגיש. בדקו הרשאה ומדיניות ארגונית לפני העלאה לכלי.</Notice>
        ) : null}
        <div className="navi-question-card__actions">
          <button type="button" className="navi-action navi-action--secondary" onClick={actions.back}>חזרה</button>
          <button type="button" className="navi-action navi-action--primary" disabled={!validation.canContinue} onClick={actions.continue}>המשך</button>
        </div>
      </div>
    </section>
  )
}
