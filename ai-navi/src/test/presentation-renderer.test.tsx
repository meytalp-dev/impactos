import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { slides } from '../data/slides'
import { SlideRenderer } from '../features/presentation/SlideRenderer'
import type { SlideDefinition } from '../lib/presentationTypes'

const baseSlide = {
  id: 'review-fixture',
  section: 'בדיקה',
  title: 'שקופית בדיקה',
  duration: 30,
  body: 'תוכן קריא',
  bullets: ['פריט ראשון', 'פריט שני'],
  speakerNotes: ['הערה ראשונה', 'הערה שנייה'],
}

function renderSlide(slide: SlideDefinition) {
  return render(<SlideRenderer slide={slide} revealIndex={0} slideNumber={1} totalSlides={1} />)
}

describe('SlideRenderer layout dispatch', () => {
  afterEach(cleanup)

  it('renders a cover from its typed layout and variant even when its id is unknown', () => {
    renderSlide({
      ...baseSlide,
      id: 'an-id-the-renderer-has-never-seen',
      layout: 'cover',
      variant: 'route-map',
      visual: { routes: ['מחקר', 'כתיבה'] },
    } as SlideDefinition)

    expect(screen.getByLabelText('מסלולים לקטגוריות עבודה')).toBeInTheDocument()
  })

  it.each([
    ['junction-task', 'ענן אפשרויות'],
    ['junction-involvement', 'מצבי מעורבות'],
    ['demo-fast-route', 'מסלול עבודה'],
    ['game-choose-route', 'משחק החלטה'],
    ['families-map', 'מפת משפחות כלים'],
    ['navigator-walkthrough', 'שאלות הניווט'],
  ])('renders %s through its typed visual variant', (id, accessibleName) => {
    const slide = slides.find((candidate) => candidate.id === id)
    expect(slide).toBeDefined()

    renderSlide({ ...slide, id: `unknown-${id}` } as SlideDefinition)

    expect(screen.getByLabelText(accessibleName)).toBeInTheDocument()
  })

  it('renders the summary call to action as a real navigator link', () => {
    const summary = slides.find((slide) => slide.id === 'summary')
    expect(summary).toBeDefined()

    renderSlide(summary as SlideDefinition)

    expect(screen.getByRole('link', { name: 'מה המשימה שלך היום?' })).toHaveAttribute('href', '/navigator')
  })

  it('renders the live navigator transition from typed navigator data when the slide id is unknown', () => {
    const navigator = slides.find((slide) => slide.id === 'navigator-walkthrough')
    expect(navigator).toBeDefined()

    renderSlide({ ...navigator, id: 'unknown-live-transition' } as SlideDefinition)

    expect(screen.getByRole('link', { name: 'פתיחת ה־Navigator' })).toHaveAttribute('href', '/navigator')
  })

  it('fails visibly when runtime slide data contains an unsupported variant', () => {
    renderSlide({
      ...baseSlide,
      layout: 'statement',
      variant: 'unknown-variant',
    } as unknown as SlideDefinition)

    expect(screen.getByRole('alert')).toHaveTextContent('תצורת שקופית אינה נתמכת: statement / unknown-variant')
  })

  it('models the opening act variants explicitly instead of encoding them in ids', () => {
    expect(slides.slice(0, 5).map(({ layout, variant }) => [layout, variant])).toEqual([
      ['cover', 'route-map'],
      ['statement', 'tool-overload'],
      ['statement', 'problem'],
      ['comparison', 'route-comparison'],
      ['map', 'junction-map'],
    ])
  })
})
