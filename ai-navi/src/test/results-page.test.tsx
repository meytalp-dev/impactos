import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import ResultsPage from '../pages/ResultsPage'
import { NavigatorProvider } from '../features/navigator/NavigatorProvider'
import { saveNavigatorState } from '../lib/storage'
import type { NavigatorAnswers, PersistedNavigatorState } from '../lib/types'

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

const completeAnswers = (overrides: Partial<NavigatorAnswers> = {}): NavigatorAnswers => ({
  taskText: 'להפוך דוח רבעוני למצגת להנהלה',
  taskTypes: ['present'],
  taskType: 'present',
  inputTypes: ['documents'],
  inputType: 'documents',
  outputType: 'presentation',
  priorities: ['quality'],
  priority: 'quality',
  timeAvailable: 'under-one-hour',
  difficulty: 'intermediate',
  privacy: 'no',
  context: 'management',
  audience: 'הנהלה בכירה',
  ...overrides,
})

const saveCompleteState = (overrides: Partial<NavigatorAnswers> = {}) => {
  const answers = completeAnswers(overrides)
  const state: PersistedNavigatorState = {
    version: 1,
    mode: 'questions',
    currentStep: 6,
    taskText: answers.taskText,
    answers,
    privacyConfirmed: answers.privacy === 'yes' || answers.privacy === 'unsure',
    complete: true,
  }
  saveNavigatorState(state)
}

const renderApp = (route = '/results') => render(
  <MemoryRouter initialEntries={[route]}>
    <App />
  </MemoryRouter>,
)

const renderResultsPage = () => render(
  <MemoryRouter initialEntries={['/results']}>
    <NavigatorProvider>
      <ResultsPage />
    </NavigatorProvider>
  </MemoryRouter>,
)

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
  else Reflect.deleteProperty(navigator, 'clipboard')
})

describe('explainable recommendation results', () => {
  it('introduces the original task and shows a connected route with two to four named tools', () => {
    saveCompleteState()
    const view = renderResultsPage()

    expect(screen.getByRole('heading', { name: 'המסלול המומלץ עבורך' })).toBeInTheDocument()
    expect(screen.getByText('להפוך דוח רבעוני למצגת להנהלה')).toBeInTheDocument()
    expect(screen.getByText(/המשימה שלך/)).toBeInTheDocument()

    const diagram = screen.getByRole('navigation', { name: 'תרשים המסלול המומלץ' })
    expect(within(diagram).getByText('קלט')).toBeInTheDocument()
    expect(within(diagram).getByText('שלב 1')).toBeInTheDocument()
    expect(within(diagram).getByText('שלב 2')).toBeInTheDocument()
    expect(within(diagram).getByText('תוצר')).toBeInTheDocument()

    const primaryTools = [...view.container.querySelectorAll<HTMLElement>('[data-primary-tool]')]
    expect(primaryTools).toHaveLength(2)
    expect(primaryTools.every((tool) => Boolean(tool.textContent?.trim()))).toBe(true)
    expect(new Set(primaryTools.map((tool) => tool.dataset.primaryTool)).size).toBe(primaryTools.length)
  })

  it('explains each ordered stage, including AI work, human responsibility, checks and alternatives', () => {
    saveCompleteState()
    const view = renderResultsPage()
    const stages = [...view.container.querySelectorAll<HTMLElement>('[data-route-step]')]

    expect(stages).toHaveLength(2)
    for (const [index, stage] of stages.entries()) {
      expect(stage).toHaveTextContent(`שלב ${index + 1}`)
      expect(stage).toHaveTextContent('תפקיד')
      expect(stage).toHaveTextContent('למה מתאים')
      expect(stage).toHaveTextContent('מה לספק')
      expect(stage).toHaveTextContent('התוצר הצפוי')
      expect(stage).toHaveTextContent('מה ה-AI עושה')
      expect(stage).toHaveTextContent('מה נשאר באחריותך')
      expect(stage).toHaveTextContent('מה לבדוק')
      expect(stage).toHaveTextContent('כלים חלופיים לשלב')
    }
    expect(stages[0]).toHaveTextContent('כמה מסמכים')
    expect(stages[0]).not.toHaveTextContent(/\bdocuments\b/)
  })

  it('renders distinct fast, professional and budget routes with tool names and tradeoffs', () => {
    saveCompleteState()
    const view = renderResultsPage()

    const fast = screen.getByRole('article', { name: 'מסלול מהיר' })
    const professional = screen.getByRole('article', { name: 'מסלול מקצועי' })
    const budget = screen.getByRole('article', { name: 'מסלול חסכוני' })
    expect(fast).toHaveTextContent(/מהיר|זמן/)
    expect(professional).toHaveTextContent(/מקצועי|איכות/)
    expect(budget).toHaveTextContent(/חסכוני|עלות/)

    const toolSets = [fast, professional, budget].map((card) =>
      [...card.querySelectorAll<HTMLElement>('[data-alternative-tool]')].map((tool) => tool.dataset.alternativeTool),
    )
    expect(toolSets.every((tools) => tools.length > 0)).toBe(true)
    expect(new Set(toolSets.flat()).size).toBe(toolSets.flat().length)
    expect(view.container.querySelectorAll('[data-alternative-route]')).toHaveLength(3)
  })

  it('keeps freshness, quality and Hebrew checks inside the printable warning group', () => {
    saveCompleteState()
    renderResultsPage()

    const warnings = screen.getByRole('region', { name: 'אזהרות ובדיקות לפני שימוש' })
    expect(warnings).toHaveTextContent('המלצות וכלים עשויים להשתנות')
    expect(warnings).toHaveTextContent(/דיוק|איכות/)
    expect(warnings).toHaveTextContent(/עברית/)
  })

  it('preserves validated marketing context and audience in the result summary and generated prompt', () => {
    saveCompleteState({ context: 'marketing', audience: 'צוות שיווק ויזמות' })
    renderResultsPage()

    expect(screen.getByText('הקשר: שיווק · קהל: צוות שיווק ויזמות')).toBeInTheDocument()
    const prompt = screen.getByRole('textbox', { name: 'פרומפט מוכן להעתקה' }) as HTMLTextAreaElement
    expect(prompt.value).toContain('הקשר: שיווק')
    expect(prompt.value).toContain('קהל: צוות שיווק ויזמות')
  })

  it('requires source checks when research is a secondary selected task', () => {
    saveCompleteState({ taskTypes: ['present', 'research'], taskType: 'present' })
    renderResultsPage()

    expect(screen.getByRole('region', { name: 'אזהרות ובדיקות לפני שימוש' }))
      .toHaveTextContent('פתחו את המקורות המקוריים ובדקו מחבר, תאריך והקשר')
    expect((screen.getByRole('textbox', { name: 'פרומפט מוכן להעתקה' }) as HTMLTextAreaElement).value).toContain('מקורות:')
  })

  it('uses the privacy warning and withholds public tool recommendations for sensitive work', () => {
    saveCompleteState({
      taskText: 'ניתוח תגובות רגישות מסקר עובדים',
      taskTypes: ['analyze'], taskType: 'analyze',
      inputTypes: ['data'], inputType: 'data', outputType: 'report',
      priorities: ['privacy'], priority: 'privacy', privacy: 'yes',
    })
    const view = renderResultsPage()

    expect(screen.getByRole('alert', { name: 'אזהרת פרטיות' })).toHaveTextContent(/מידע רגיש/)
    expect(screen.getByRole('alert', { name: 'אזהרת פרטיות' })).toHaveTextContent(/כלי.*ארגון/)
    expect(view.container.querySelectorAll('[data-primary-tool]')).toHaveLength(0)
    expect(view.container.querySelectorAll('[data-alternative-tool]')).toHaveLength(0)
  })
})

describe('result actions', () => {
  it('copies the starter prompt and announces success only after clipboard resolution', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    saveCompleteState()
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'העתקת הפרומפט' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(writeText.mock.calls[0][0]).toContain('להפוך דוח רבעוני למצגת להנהלה')
    expect(screen.getByRole('status')).toHaveTextContent('הפרומפט הועתק')
  })

  it('selects the prompt and gives manual-copy instructions when clipboard writing fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    saveCompleteState()
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'העתקת הפרומפט' }))

    const prompt = screen.getByRole('textbox', { name: 'פרומפט מוכן להעתקה' })
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('העתקה אוטומטית לא הצליחה'))
    expect(screen.getByRole('status')).not.toHaveTextContent('הפרומפט הועתק')
    expect(document.activeElement).toBe(prompt)
  })

  it('preserves answers for editing, resets scoped state after confirmation, prints, and links to presentation', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    saveCompleteState()
    const view = renderApp()

    expect(screen.getByRole('link', { name: 'שינוי תשובה' })).toHaveAttribute('href', '/navigator')
    expect(screen.getByRole('link', { name: 'פתיחת מצב מצגת' })).toHaveAttribute('href', '/presentation')
    fireEvent.click(screen.getByRole('button', { name: 'הדפסה / שמירה כ־PDF' }))
    expect(print).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('link', { name: 'שינוי תשובה' }))
    expect(screen.getByRole('heading', { name: 'האם יש במשימה מידע אישי או רגיש?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'לא' })).toHaveAttribute('aria-pressed', 'true')

    view.unmount()
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'ניווט חדש' }))
    expect(confirm).toHaveBeenCalled()
    expect(localStorage.getItem('ai-navi:navigator-state:v1')).toBeNull()
    expect(screen.getByRole('heading', { name: 'מה המשימה שלך היום?' })).toBeInTheDocument()
  })
})

describe('results guard and print contract', () => {
  it('does not generate recommendations from a direct or forged incomplete state', () => {
    localStorage.setItem('ai-navi:navigator-state:v1', JSON.stringify({
      version: 1,
      mode: 'questions',
      currentStep: 6,
      taskText: 'משימה מזויפת',
      complete: true,
      answers: {
        taskText: 'משימה מזויפת', taskTypes: ['not-a-task'], inputTypes: ['data'], outputType: 'report',
        priorities: ['accuracy'], timeAvailable: 'under-one-hour', difficulty: 'intermediate', privacy: 'no',
      },
    }))
    const view = renderApp()

    expect(screen.getByRole('heading', { name: 'התוצאות שלך' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('צריך להשלים את הניווט')
    expect(screen.getByRole('link', { name: 'חזרה לניווט' })).toHaveAttribute('href', '/navigator')
    expect(view.container.querySelector('[data-result-route]')).not.toBeInTheDocument()
  })

  it('defines clean expanded print output without hiding warnings or splitting stage cards', () => {
    saveCompleteState()
    const view = renderResultsPage()
    const css = readFileSync(resolve(process.cwd(), 'src/styles/print.css'), 'utf8')
    const printablePrompt = view.container.querySelector('.navi-prompt-card__print-text')

    expect(printablePrompt).toHaveTextContent('להפוך דוח רבעוני למצגת להנהלה')
    expect(css).toMatch(/@media\s+print/)
    expect(css).toMatch(/\.navi-results-actions[^{]*\{[^}]*display:\s*none/s)
    expect(css).toMatch(/\.navi-freshness[^{]*\{[^}]*display:\s*none/s)
    expect(css).toMatch(/\.navi-route-step[^{]*\{[^}]*break-inside:\s*avoid/s)
    expect(css).toMatch(/\.navi-print-only[^{]*\{[^}]*display:\s*block/s)
    expect(css).toMatch(/\.navi-prompt-card__text[^{]*\{[^}]*display:\s*none/s)
    expect(css).toMatch(/\.navi-prompt-card__print-text[^{]*\{[^}]*white-space:\s*pre-wrap[^}]*overflow-wrap:\s*anywhere/s)
    expect(css).toMatch(/\.navi-results\s+\*[^{]*\{[^}]*color:\s*#000000\s*!important[^}]*background-color:\s*transparent\s*!important[^}]*border-color:\s*#000000\s*!important[^}]*box-shadow:\s*none\s*!important/s)
    for (const selector of ['endpoint', 'stage']) {
      expect(css).toMatch(new RegExp(`\\.navi-route-diagram__${selector}[^\\{]*\\{[^}]*background:\\s*#ffffff\\s*!important[^}]*border-color:\\s*#000000\\s*!important`, 's'))
    }
    expect(css).toMatch(/\.navi-route-step__number[^\{]*\{[^}]*color:\s*#000000\s*!important[^}]*background:\s*#ffffff\s*!important[^}]*border:\s*2px\s+solid\s+#000000\s*!important/s)
    expect(css).toMatch(/\.navi-route-diagram__connector[^\{]*\{[^}]*color:\s*#000000\s*!important/s)
    expect(css).toMatch(/\.navi-privacy-warning[^\{]*\{[^}]*color:\s*#000000\s*!important[^}]*background:\s*#ffffff\s*!important[^}]*border-color:\s*#000000\s*!important/s)
    expect(css).toMatch(/background:\s*#?fff(?:fff)?/i)
    expect(css).toMatch(/color:\s*#(?:000|000000)/i)
  })
})
