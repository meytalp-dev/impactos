import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { navigatorQuestions, type NavigatorOptionValue, type NavigatorQuestionId } from '../../data/questions'
import { loadNavigatorState, resetNavigatorState, saveNavigatorState } from '../../lib/storage'
import type { InputType, NavigatorAnswers, PersistedNavigatorState, Priority, TaskType } from '../../lib/types'

export type NavigatorMode = 'intro' | 'questions' | 'privacy-gate'

interface NavigatorCoreState {
  mode: NavigatorMode
  currentStep: number
  taskText: string
  answers: NavigatorAnswers
  privacyConfirmed: boolean
  complete: boolean
}

export interface NavigatorValidation {
  canContinue: boolean
  message: string | null
  complete: boolean
}

export interface NavigatorContextValue extends NavigatorCoreState {
  validation: NavigatorValidation
  actions: {
    start: (taskText: string) => void
    select: (questionId: NavigatorQuestionId, value: NavigatorOptionValue) => void
    continue: () => void
    back: () => void
    edit: (step: number) => void
    reset: () => void
    confirmPrivacy: () => void
  }
}

const initialState: NavigatorCoreState = {
  mode: 'intro', currentStep: 0, taskText: '', answers: {}, privacyConfirmed: false, complete: false,
}

const NavigatorContext = createContext<NavigatorContextValue | null>(null)

export function isStepAnswered(answers: NavigatorAnswers, step: number): boolean {
  const question = navigatorQuestions[step]
  if (!question) return false
  const answer = answers[question.id]
  const allowed = new Set<unknown>(question.options.map(({ value }) => value))
  if (question.selection === 'multiple') {
    return Array.isArray(answer)
      && answer.length > 0
      && answer.length <= (question.maxSelections ?? question.options.length)
      && new Set(answer).size === answer.length
      && answer.every((value) => allowed.has(value))
      && (question.id !== 'inputTypes' || !answer.some((value) => value === 'none') || answer.length === 1)
  }
  return typeof answer === 'string' && allowed.has(answer)
}

export function isNavigatorComplete(state: Pick<NavigatorCoreState, 'answers' | 'complete' | 'privacyConfirmed' | 'taskText'>): boolean {
  if (!state.complete || !state.taskText.trim() || !navigatorQuestions.every((_, index) => isStepAnswered(state.answers, index))) return false
  return (state.answers.privacy !== 'yes' && state.answers.privacy !== 'unsure' && state.answers.privacy !== 'maybe') || state.privacyConfirmed
}

function firstCompletionIssue(taskText: string, answers: NavigatorAnswers): { mode: NavigatorMode; currentStep: number } | null {
  if (!taskText.trim()) return { mode: 'intro', currentStep: 0 }
  const invalidStep = navigatorQuestions.findIndex((_, index) => !isStepAnswered(answers, index))
  return invalidStep === -1 ? null : { mode: 'questions', currentStep: invalidStep }
}

function restoreState(): NavigatorCoreState {
  const saved = loadNavigatorState()
  if (!saved) return initialState
  const taskText = (saved.taskText ?? saved.answers.taskText ?? '').trim()
  const currentStep = Math.max(0, Math.min(saved.currentStep ?? 0, navigatorQuestions.length - 1))
  const requestedMode = saved.mode ?? (taskText ? 'questions' : 'intro')
  const mode = requestedMode === 'privacy-gate' && saved.answers.privacy !== 'yes' && saved.answers.privacy !== 'unsure' && saved.answers.privacy !== 'maybe'
    ? 'questions'
    : requestedMode
  return {
    mode,
    currentStep,
    taskText,
    answers: { ...saved.answers, ...(taskText ? { taskText } : {}) },
    privacyConfirmed: saved.privacyConfirmed === true,
    complete: saved.complete === true,
  }
}

const toPersisted = (state: NavigatorCoreState): PersistedNavigatorState => ({
  version: 1,
  mode: state.mode,
  currentStep: state.currentStep,
  taskText: state.taskText,
  answers: state.answers,
  privacyConfirmed: state.privacyConfirmed,
  complete: state.complete,
})

export function NavigatorProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [state, setState] = useState<NavigatorCoreState>(restoreState)
  const [message, setMessage] = useState<string | null>(null)
  const canContinue = state.mode === 'questions' && isStepAnswered(state.answers, state.currentStep)

  useEffect(() => {
    const meaningful = state.taskText.trim().length > 0 || state.mode !== 'intro' || Object.keys(state.answers).length > 0
    if (meaningful) saveNavigatorState(toPersisted(state))
  }, [state])

  const actions = useMemo<NavigatorContextValue['actions']>(() => ({
    start(taskText) {
      const normalized = taskText.trim()
      if (!normalized) return
      setMessage(null)
      setState((current) => ({ ...current, mode: 'questions', currentStep: 0, taskText: normalized, answers: { ...current.answers, taskText: normalized }, complete: false }))
    },
    select(questionId, value) {
      setState((current) => {
        const nextAnswers = { ...current.answers }
        if (questionId === 'taskTypes') {
          const selected = current.answers.taskTypes ?? []
          const next = selected.includes(value as TaskType) ? selected.filter((item) => item !== value) : [...selected, value as TaskType]
          nextAnswers.taskTypes = next
          nextAnswers.taskType = next[0]
        } else if (questionId === 'inputTypes') {
          const selected = current.answers.inputTypes ?? []
          const inputValue = value as InputType
          const next = selected.includes(inputValue)
            ? selected.filter((item) => item !== inputValue)
            : inputValue === 'none' ? ['none' as InputType] : [...selected.filter((item) => item !== 'none'), inputValue]
          nextAnswers.inputTypes = next
          nextAnswers.inputType = next[0]
        } else if (questionId === 'priorities') {
          const selected = current.answers.priorities ?? []
          const priority = value as Priority
          if (!selected.includes(priority) && selected.length >= 2) {
            setMessage('אפשר לבחור עד שתי עדיפויות. כדי לבחור אחרת, בטלי אחת מהבחירות.')
            return current
          }
          const next = selected.includes(priority) ? selected.filter((item) => item !== priority) : [...selected, priority]
          nextAnswers.priorities = next
          nextAnswers.priority = next[0]
        } else {
          Object.assign(nextAnswers, { [questionId]: value })
        }
        setMessage(null)
        return { ...current, answers: nextAnswers, complete: false, privacyConfirmed: false }
      })
    },
    continue() {
      if (!isStepAnswered(state.answers, state.currentStep)) return
      setMessage(null)
      if (state.currentStep < navigatorQuestions.length - 1) {
        setState((current) => ({ ...current, currentStep: current.currentStep + 1 }))
        return
      }
      const completionIssue = firstCompletionIssue(state.taskText, state.answers)
      if (completionIssue) {
        setMessage('צריך להשלים או לתקן את התחנה המסומנת לפני הצגת התוצאות.')
        setState((current) => ({ ...current, ...completionIssue, complete: false, privacyConfirmed: false }))
        return
      }
      if (state.answers.privacy === 'yes' || state.answers.privacy === 'unsure' || state.answers.privacy === 'maybe') {
        setState((current) => ({ ...current, mode: 'privacy-gate', complete: false, privacyConfirmed: false }))
        return
      }
      const completed = { ...state, mode: 'questions' as const, complete: true, privacyConfirmed: false }
      saveNavigatorState(toPersisted(completed))
      setState(completed)
      navigate('/results')
    },
    back() {
      setMessage(null)
      setState((current) => {
        if (current.mode === 'privacy-gate') return { ...current, mode: 'questions', currentStep: navigatorQuestions.length - 1 }
        if (current.currentStep === 0) return { ...current, mode: 'intro' }
        return { ...current, currentStep: current.currentStep - 1 }
      })
    },
    edit(step) {
      if (step < 0 || step >= state.currentStep || !isStepAnswered(state.answers, step)) return
      setMessage(null)
      setState((current) => ({ ...current, mode: 'questions', currentStep: step, complete: false, privacyConfirmed: false }))
    },
    reset() {
      if (!window.confirm('לאפס את הניווט? התשובות שנשמרו יימחקו.')) return
      resetNavigatorState()
      setMessage(null)
      setState(initialState)
      navigate('/navigator')
    },
    confirmPrivacy() {
      const completionIssue = firstCompletionIssue(state.taskText, state.answers)
      if (completionIssue) {
        setMessage('צריך להשלים או לתקן את התחנה המסומנת לפני הצגת התוצאות.')
        setState((current) => ({ ...current, ...completionIssue, complete: false, privacyConfirmed: false }))
        return
      }
      const completed = { ...state, mode: 'questions' as const, complete: true, privacyConfirmed: true }
      saveNavigatorState(toPersisted(completed))
      setState(completed)
      navigate('/results')
    },
  }), [navigate, state])

  return (
    <NavigatorContext.Provider value={{ ...state, validation: { canContinue, message, complete: isNavigatorComplete(state) }, actions }}>
      {children}
    </NavigatorContext.Provider>
  )
}

export function useNavigator(): NavigatorContextValue {
  const context = useContext(NavigatorContext)
  if (!context) throw new Error('useNavigator must be used within NavigatorProvider')
  return context
}
