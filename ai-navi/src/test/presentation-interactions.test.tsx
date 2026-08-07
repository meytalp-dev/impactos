import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BudgetGame } from '../features/presentation/BudgetGame'
import { ChoiceGame } from '../features/presentation/ChoiceGame'
import { FamilyMap } from '../features/presentation/FamilyMap'
import { Poll } from '../features/presentation/Poll'
import { PresentationShell } from '../features/presentation/PresentationShell'
import type {
  BudgetGameVisual,
  ChoiceGameVisual,
  FamilyMapVisual,
  SlideDefinition,
} from '../lib/presentationTypes'

const routeGame: ChoiceGameVisual = {
  kind: 'choice-game',
  prompt: 'מהו המסלול הראשון?',
  selectionMode: 'single',
  options: [
    { id: 'image', label: 'כלי תמונה' },
    { id: 'data-talk', label: 'כלי ניתוח נתונים + כלי שיחה' },
    { id: 'slides', label: 'מצגת בלבד' },
  ],
  correctOptionIds: ['data-talk'],
  reveal: {
    title: 'המסלול המתאים',
    explanation: 'ניתוח הנתונים מזהה נושאים חוזרים וכלי השיחה מסייע לפרש אותם.',
    humanChecks: ['בודקים דוגמאות מקוריות', 'מאמתים שהקיבוץ מייצג את התשובות'],
  },
}

const privacyGame: ChoiceGameVisual = {
  kind: 'choice-game',
  prompt: 'איזו פעולה בטוחה יותר?',
  selectionMode: 'multiple',
  options: [
    { id: 'public', label: 'כלי ציבורי רגיל' },
    { id: 'approved', label: 'כלי ארגוני מאושר' },
    { id: 'deidentify', label: 'הסרת מזהים' },
    { id: 'no-upload', label: 'לא מעלים' },
    { id: 'combine', label: 'שילוב כמה צעדים' },
  ],
  unsafeOptionIds: ['public'],
  reveal: {
    title: 'בדיקת המסלול הרגיש',
    explanation: 'כלי מאושר, צמצום מידע או הימנעות מהעלאה עשויים להתאים — לפי מדיניות הארגון.',
  },
  disclaimer: 'אין זו המלצה משפטית או אבטחתית. יש לפעול לפי מדיניות הארגון.',
}

const budgetGame: BudgetGameVisual = {
  kind: 'budget-game',
  prompt: 'בנו מסלול של עד 10 נקודות',
  budget: 10,
  options: [
    { id: 'researcher', label: 'חוקר', cost: 2 },
    { id: 'writer', label: 'כותב', cost: 2 },
    { id: 'designer', label: 'מעצב', cost: 3 },
    { id: 'analyst', label: 'אנליסט', cost: 3 },
    { id: 'video', label: 'יוצר וידאו', cost: 4 },
    { id: 'human-reviewer', label: 'בודק אנושי', cost: 2 },
    { id: 'automation', label: 'אוטומציה', cost: 4 },
  ],
  humanReviewerId: 'human-reviewer',
  reveal: {
    title: 'מסלול אפשרי',
    example: 'חוקר + כותב + מעצב + אנליסט = 10',
    explanation: 'יותר התמחות משפרת עומק, אך מוסיפה העברות ותיאום.',
  },
}

const familyMap: FamilyMapVisual = {
  kind: 'family-map',
  families: [
    { id: 'conversation', name: 'חשיבה ושיחה', use: 'לחדד רעיונות ולנסח', line: 'blue' },
    { id: 'research', name: 'מחקר ומקורות', use: 'לאתר מידע ולאמת מקורות', line: 'blue' },
    { id: 'knowledge', name: 'מסמכים וידע ארגוני', use: 'לעבוד עם חומר קיים', line: 'blue' },
    { id: 'design', name: 'מצגות ועיצוב', use: 'לבנות סיפור חזותי', line: 'peach' },
    { id: 'image', name: 'תמונה', use: 'ליצור ולהמחיש', line: 'peach' },
    { id: 'media', name: 'וידאו ואודיו', use: 'להפיק תוכן בזמן', line: 'peach' },
    { id: 'data', name: 'נתונים', use: 'לזהות דפוסים', line: 'sage' },
    { id: 'code', name: 'בנייה וקוד', use: 'ליצור כלי עובד', line: 'sage' },
    { id: 'automation', name: 'אוטומציה וסוכנים', use: 'לחבר תהליך חוזר', line: 'sage' },
  ],
}

describe('presentation audience interactions', () => {
  beforeEach(() => localStorage.clear())
  afterEach(cleanup)

  it('keeps poll selection and vote counts local to this screen', () => {
    render(
      <Poll
        ariaLabel="בחירת מסלול"
        options={routeGame.options}
        selectionMode="single"
        resetToken={0}
        showTotals
        onSelectionChange={() => undefined}
      />,
    )

    const image = screen.getByRole('button', { name: /כלי תמונה/ })
    const data = screen.getByRole('button', { name: /כלי ניתוח נתונים/ })
    fireEvent.click(image)
    expect(image).toHaveAttribute('aria-pressed', 'true')
    expect(within(image).getByText('בחירה מקומית: 1')).toBeInTheDocument()

    fireEvent.click(data)
    expect(image).toHaveAttribute('aria-pressed', 'false')
    expect(data).toHaveAttribute('aria-pressed', 'true')
    expect(within(data).getByText('בחירה מקומית: 1')).toBeInTheDocument()
    expect(screen.queryByText(/משתתפים|קהל הצביע/)).not.toBeInTheDocument()
  })

  it('reveals the correct route and human checks only after a selection', () => {
    render(<ChoiceGame data={routeGame} resetToken={0} />)

    const reveal = screen.getByRole('button', { name: 'חשיפת הסבר' })
    expect(reveal).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /כלי ניתוח נתונים/ }))
    fireEvent.click(reveal)

    expect(screen.getByRole('heading', { name: 'המסלול המתאים' })).toBeInTheDocument()
    expect(screen.getByText(/ניתוח הנתונים מזהה נושאים חוזרים/)).toBeInTheDocument()
    expect(screen.getByText('בודקים דוגמאות מקוריות')).toBeInTheDocument()
    expect(screen.getByText('בחירה מתאימה')).toBeInTheDocument()
  })

  it('always shows the privacy disclaimer and rejects automatic public upload', () => {
    render(<ChoiceGame data={privacyGame} resetToken={0} />)

    expect(screen.getByText('אין זו המלצה משפטית או אבטחתית. יש לפעול לפי מדיניות הארגון.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /כלי ציבורי רגיל/ }))
    fireEvent.click(screen.getByRole('button', { name: 'חשיפת הסבר' }))
    expect(screen.getByText('הבחירה כוללת מסלול שאינו בטוח אוטומטית')).toBeInTheDocument()
    expect(screen.getByText('כלי מאושר, צמצום מידע או הימנעות מהעלאה עשויים להתאים — לפי מדיניות הארגון.')).toBeInTheDocument()
  })

  it('caps the budget at 10, announces remaining points, and warns without human review', () => {
    render(<BudgetGame data={budgetGame} resetToken={0} />)

    for (const label of ['חוקר', 'כותב', 'מעצב', 'אנליסט']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }))
    }
    expect(screen.getByRole('status')).toHaveTextContent('נותרו 0 נקודות')
    fireEvent.click(screen.getByRole('button', { name: /יוצר וידאו/ }))
    expect(screen.getByRole('status')).toHaveTextContent('לא ניתן לבחור יוצר וידאו: החריגה היא 4 נקודות')
    expect(screen.getByRole('button', { name: /יוצר וידאו/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('alert')).toHaveTextContent('חסרה ביקורת אנושית במסלול')
  })

  it('reveals a valid budget route and its tradeoff after a selection', () => {
    render(<BudgetGame data={budgetGame} resetToken={0} />)
    fireEvent.click(screen.getByRole('button', { name: /בודק אנושי/ }))
    fireEvent.click(screen.getByRole('button', { name: 'חשיפת הסבר' }))

    expect(screen.getByRole('heading', { name: 'מסלול אפשרי' })).toBeInTheDocument()
    expect(screen.getByText('חוקר + כותב + מעצב + אנליסט = 10')).toBeInTheDocument()
    expect(screen.getByText(/יותר התמחות משפרת עומק/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('makes all nine family stations focusable and reveals the selected use in place', () => {
    render(<FamilyMap data={familyMap} resetToken={0} />)

    const stations = screen.getAllByRole('button')
    expect(stations).toHaveLength(9)
    fireEvent.click(screen.getByRole('button', { name: /נתונים/ }))
    expect(screen.getByRole('button', { name: /נתונים/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('region', { name: 'שימוש במשפחת נתונים' })).toHaveTextContent('לזהות דפוסים')
  })

  it('presenter reset clears the current slide interaction and announces it', () => {
    const slide: SlideDefinition = {
      id: 'fixture-with-an-unknown-id',
      section: 'בדיקה',
      title: 'משחק מסלול',
      duration: 30,
      layout: 'activity',
      variant: 'choice-grid',
      interaction: 'choice-game',
      speakerNotes: ['בדיקת איפוס'],
      visual: routeGame,
    }
    render(<PresentationShell slides={[slide]} />)

    const option = screen.getByRole('button', { name: /כלי ניתוח נתונים/ })
    fireEvent.click(option)
    expect(option).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(window, { key: 'n' })
    fireEvent.click(screen.getByRole('button', { name: 'איפוס האינטראקציה בשקופית' }))

    expect(option).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('האינטראקציה בשקופית אופסה')
    expect(screen.getByRole('button', { name: 'חשיפת הסבר' })).toBeDisabled()
  })
})
