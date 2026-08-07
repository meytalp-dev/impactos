import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { slides } from '../data/slides'
import { SlideRenderer } from '../features/presentation/SlideRenderer'
import type { SlideDefinition, SlideLayout } from '../lib/presentationTypes'

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

  it.each<SlideLayout>(['activity', 'demo', 'families', 'summary'])(
    'renders declared %s layouts through the standard content renderer',
    (layout) => {
      renderSlide({ ...baseSlide, layout, variant: 'standard' } as SlideDefinition)

      expect(screen.getByLabelText(`תוכן שקופית ${layout}`)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'שקופית בדיקה' })).toBeInTheDocument()
    },
  )

  it('fails visibly when runtime slide data contains an unsupported variant', () => {
    renderSlide({
      ...baseSlide,
      layout: 'statement',
      variant: 'unknown-variant',
    } as unknown as SlideDefinition)

    expect(screen.getByRole('alert')).toHaveTextContent('תצורת שקופית אינה נתמכת: statement / unknown-variant')
  })

  it('models the opening act variants explicitly instead of encoding them in ids', () => {
    expect(slides.map(({ layout, variant }) => [layout, variant])).toEqual([
      ['cover', 'route-map'],
      ['statement', 'tool-overload'],
      ['statement', 'problem'],
      ['comparison', 'route-comparison'],
      ['map', 'junction-map'],
    ])
  })
})
