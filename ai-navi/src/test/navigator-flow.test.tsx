import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { navigatorQuestions } from '../data/questions'
import { saveNavigatorState } from '../lib/storage'

const renderNavigator = (route = '/navigator') => render(
  <MemoryRouter initialEntries={[route]}>
    <App />
  </MemoryRouter>,
)

const startNavigator = (task = 'להפוך דוח רבעוני למצגת להנהלה') => {
  fireEvent.change(screen.getByPlaceholderText('תארי בשפה פשוטה מה את רוצה לעשות'), { target: { value: task } })
  fireEvent.click(screen.getByRole('button', { name: 'התחלת ניווט' }))
}

const answerAndContinue = (label: string) => {
  fireEvent.click(screen.getByRole('button', { name: label }))
  fireEvent.click(screen.getByRole('button', { name: 'המשך' }))
}

const reachPrivacyQuestion = () => {
  startNavigator()
  answerAndContinue('חשיבה ותכנון')
  answerAndContinue('רעיון')
  answerAndContinue('מצגת')
  answerAndContinue('איכות')
  answerAndContinue('עד שעה')
  answerAndContinue('בינונית')
}

const expectedQuestionOptionLabels = [
  ['חשיבה ותכנון', 'מחקר', 'כתיבה', 'ניתוח', 'עיצוב', 'תמונה', 'וידאו או אודיו', 'מצגת', 'בניית אפליקציה', 'אוטומציה'],
  ['אין לי חומר גלם', 'רעיון', 'טקסט קצר', 'מסמך', 'כמה מסמכים', 'נתונים', 'תמונה', 'אודיו', 'וידאו', 'קישורים או אתרים'],
  ['תשובה', 'מסמך', 'מצגת', 'תמונה', 'וידאו', 'אודיו', 'טבלה', 'דוח', 'אתר', 'אפליקציה', 'תהליך אוטומטי'],
  ['מהירות', 'איכות', 'דיוק', 'מקורות', 'עיצוב', 'קלות', 'מחיר', 'פרטיות', 'שליטה'],
  ['עד 10 דקות', 'עד שעה', 'כמה שעות', 'יום או יותר'],
  ['מתחילה', 'בינונית', 'מתקדמת'],
  ['לא', 'אולי', 'כן', 'לא בטוחה'],
] as const

describe('seven-step personal navigator', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('keeps start disabled for blank text and exposes every rotating example to assistive technology', () => {
    renderNavigator()

    expect(screen.getByRole('heading', { name: 'מה המשימה שלך היום?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'התחלת ניווט' })).toBeDisabled()
    for (const example of ['מסמך למצגת', 'ניתוח שאלון', 'סרטון פתיחה', 'פעילות לתלמידים', 'סיכום כמה מסמכים', 'כלי דיגיטלי']) {
      expect(screen.getAllByText(example).length).toBeGreaterThan(0)
    }

    fireEvent.change(screen.getByPlaceholderText('תארי בשפה פשוטה מה את רוצה לעשות'), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'התחלת ניווט' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('תארי בשפה פשוטה מה את רוצה לעשות'), { target: { value: 'סיכום מחקר' } })
    expect(screen.getByRole('button', { name: 'התחלת ניווט' })).toBeEnabled()
  })

  it('shows one question at a time with every required option and blocks unanswered continuation', () => {
    renderNavigator()
    startNavigator()

    navigatorQuestions.forEach((question, index) => {
      expect(screen.getByRole('heading', { name: question.title })).toBeInTheDocument()
      expect(screen.getByText(`שלב ${index + 1} מתוך 7`)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'המשך' })).toBeDisabled()
      for (const label of expectedQuestionOptionLabels[index]) {
        expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
      }
      if (index < navigatorQuestions.length - 1) {
        expect(screen.queryByRole('heading', { name: navigatorQuestions[index + 1].title })).not.toBeInTheDocument()
      }

      fireEvent.click(screen.getByRole('button', { name: expectedQuestionOptionLabels[index][0] }))
      expect(screen.getByRole('button', { name: 'המשך' })).toBeEnabled()
      fireEvent.click(screen.getByRole('button', { name: 'המשך' }))
    })

    expect(screen.getByRole('heading', { name: 'המסלול המומלץ עבורך' })).toBeInTheDocument()
  }, 10_000)

  it('caps priorities at two and gives clear live feedback without selecting a third', () => {
    renderNavigator()
    startNavigator()
    answerAndContinue('חשיבה ותכנון')
    answerAndContinue('רעיון')
    answerAndContinue('מצגת')

    fireEvent.click(screen.getByRole('button', { name: 'מהירות' }))
    fireEvent.click(screen.getByRole('button', { name: 'איכות' }))
    fireEvent.click(screen.getByRole('button', { name: 'דיוק' }))

    expect(screen.getByRole('status')).toHaveTextContent('אפשר לבחור עד שתי עדיפויות')
    expect(screen.getByRole('button', { name: 'דיוק' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'מהירות' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'איכות' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('preserves answers through back and permits editing only completed progress stations', () => {
    renderNavigator()
    startNavigator()
    answerAndContinue('כתיבה')

    expect(screen.getByRole('heading', { name: navigatorQuestions[1].title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'סוג המשימה, שלב 1 מתוך 7' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'תוצר, שלב 3 מתוך 7' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'חזרה' }))
    expect(screen.getByRole('button', { name: 'כתיבה' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'המשך' }))
    fireEvent.click(screen.getByRole('button', { name: 'סוג המשימה, שלב 1 מתוך 7' }))
    expect(screen.getByRole('heading', { name: navigatorQuestions[0].title })).toBeInTheDocument()
  })

  it('restores the current step and answers from versioned local storage after refresh', () => {
    saveNavigatorState({
      version: 1,
      mode: 'questions',
      currentStep: 2,
      taskText: 'בניית דוח מכמה מסמכים',
      answers: { taskText: 'בניית דוח מכמה מסמכים', taskTypes: ['research'], inputTypes: ['documents'] },
    })

    renderNavigator()

    expect(screen.getByRole('heading', { name: navigatorQuestions[2].title })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'חזרה' }))
    expect(screen.getByRole('button', { name: 'כמה מסמכים' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('confirms reset and deletes only AI NAVI navigator state', () => {
    localStorage.setItem('ai-navi:other:v1', 'keep-ai-navi-data')
    localStorage.setItem('unrelated-key', 'keep-unrelated-data')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderNavigator()
    startNavigator()

    fireEvent.click(screen.getByRole('button', { name: 'איפוס הניווט' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'מה המשימה שלך היום?' })).toBeInTheDocument()
    expect(localStorage.getItem('ai-navi:navigator-state:v1')).toBeNull()
    expect(localStorage.getItem('ai-navi:other:v1')).toBe('keep-ai-navi-data')
    expect(localStorage.getItem('unrelated-key')).toBe('keep-unrelated-data')
  })

  it('requires explicit confirmation for sensitive data before navigating to results', () => {
    renderNavigator()
    reachPrivacyQuestion()
    fireEvent.click(screen.getByRole('button', { name: 'כן' }))
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }))

    expect(screen.getByRole('heading', { name: 'לפני שממשיכים לתוצאות' })).toBeInTheDocument()
    expect(screen.getByText(/אין להעלות מידע אישי או רגיש ללא הרשאה/)).toBeInTheDocument()
    expect(screen.getByText(/מדיניות הארגון היא הקובעת/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'אישור והצגת תוצאות' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /קראתי והבנתי/ }))
    fireEvent.click(screen.getByRole('button', { name: 'אישור והצגת תוצאות' }))

    expect(screen.getByRole('heading', { name: 'המסלול המומלץ עבורך' })).toBeInTheDocument()
  })

  it('shows caution and requires explicit confirmation when privacy may be sensitive', () => {
    renderNavigator()
    reachPrivacyQuestion()
    fireEvent.click(screen.getByRole('button', { name: 'אולי' }))
    expect(screen.getByRole('alert')).toHaveTextContent('ייתכן שיש מידע רגיש')
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }))

    expect(screen.getByRole('heading', { name: 'לפני שממשיכים לתוצאות' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'אישור והצגת תוצאות' })).toBeDisabled()
  })

  it('rejects a forged complete state whose task and option values are not valid questionnaire answers', () => {
    localStorage.setItem('ai-navi:navigator-state:v1', JSON.stringify({
      version: 1,
      mode: 'questions',
      currentStep: 6,
      taskText: '',
      complete: true,
      privacyConfirmed: false,
      answers: {
        taskTypes: ['not-a-task'], inputTypes: ['not-an-input'], outputType: 'not-an-output',
        priorities: ['not-a-priority'], timeAvailable: 'not-a-time', difficulty: 'not-a-level', privacy: 'no',
      },
    }))

    renderNavigator('/results')

    expect(screen.getByRole('alert')).toHaveTextContent('צריך להשלים את הניווט')
  })

  it('does not enter results from restored step seven when an earlier answer is missing', () => {
    saveNavigatorState({
      version: 1,
      mode: 'questions',
      currentStep: 6,
      taskText: 'הכנת דוח הנהלה',
      answers: {
        taskText: 'הכנת דוח הנהלה', inputTypes: ['data'], outputType: 'report', priorities: ['accuracy'],
        timeAvailable: 'under-one-hour', difficulty: 'intermediate', privacy: 'no',
      },
    })
    renderNavigator()

    fireEvent.click(screen.getByRole('button', { name: 'המשך' }))

    expect(screen.getByRole('heading', { name: navigatorQuestions[0].title })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('צריך להשלים')
    expect(screen.queryByRole('heading', { name: 'התוצאות שלך' })).not.toBeInTheDocument()
  })

  it('does not confirm a restored privacy gate when an earlier answer is missing', () => {
    saveNavigatorState({
      version: 1,
      mode: 'privacy-gate',
      currentStep: 6,
      taskText: 'הכנת דוח הנהלה',
      answers: {
        taskText: 'הכנת דוח הנהלה', taskTypes: ['analyze'], outputType: 'report', priorities: ['privacy'],
        timeAvailable: 'several-hours', difficulty: 'advanced', privacy: 'yes',
      },
    })
    renderNavigator()
    fireEvent.click(screen.getByRole('checkbox', { name: /קראתי והבנתי/ }))

    fireEvent.click(screen.getByRole('button', { name: 'אישור והצגת תוצאות' }))

    expect(screen.getByRole('heading', { name: navigatorQuestions[1].title })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('צריך להשלים')
    expect(screen.queryByRole('heading', { name: 'התוצאות שלך' })).not.toBeInTheDocument()
  })

  it('rejects persisted duplicate multi-select values and returns to that question', () => {
    saveNavigatorState({
      version: 1,
      mode: 'questions',
      currentStep: 6,
      taskText: 'הכנת דוח הנהלה',
      answers: {
        taskText: 'הכנת דוח הנהלה', taskTypes: ['analyze', 'analyze'], inputTypes: ['data'], outputType: 'report',
        priorities: ['accuracy'], timeAvailable: 'under-one-hour', difficulty: 'intermediate', privacy: 'no',
      },
    })
    renderNavigator()

    fireEvent.click(screen.getByRole('button', { name: 'המשך' }))

    expect(screen.getByRole('heading', { name: navigatorQuestions[0].title })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('צריך להשלים או לתקן')
  })

  it('rejects persisted no-material alongside another input and returns to raw material', () => {
    saveNavigatorState({
      version: 1,
      mode: 'questions',
      currentStep: 6,
      taskText: 'הכנת דוח הנהלה',
      answers: {
        taskText: 'הכנת דוח הנהלה', taskTypes: ['analyze'], inputTypes: ['none', 'data'], outputType: 'report',
        priorities: ['accuracy'], timeAvailable: 'under-one-hour', difficulty: 'intermediate', privacy: 'no',
      },
    })
    renderNavigator()

    fireEvent.click(screen.getByRole('button', { name: 'המשך' }))

    expect(screen.getByRole('heading', { name: navigatorQuestions[1].title })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('צריך להשלים או לתקן')
  })
})
