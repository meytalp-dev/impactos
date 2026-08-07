import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { slides } from '../data/slides'
import { PresentationShell } from '../features/presentation/PresentationShell'

const toolOverloadTitle = 'בכל שבוע מופיע עוד כלי. אבל האם אנחנו באמת צריכים להכיר את כולם?'

function renderPresentation() {
  return render(<PresentationShell slides={slides} />)
}

describe('AI NAVI presentation data', () => {
  it('defines the complete five-slide opening act in its approved order', () => {
    expect(slides).toHaveLength(5)
    expect(slides.map(({ title }) => title)).toEqual([
      'AI NAVI',
      toolOverloadTitle,
      'הבעיה אינה מחסור בכלים',
      'גם ב־Waze לא מתחילים מהכביש',
      'שישה צמתים. החלטה אחת טובה יותר.',
    ])
    expect(slides[0].body).toBe('איך בוחרים את כלי הבינה הנכון למשימה הנכונה')
    expect(slides[2].body).toBe('הבעיה היא שאין לנו שיטת בחירה.')
    expect(slides[2].bullets).toEqual([
      'פופולריות',
      'אותו כלי לכל משימה',
      'כלי לפני תוצאה',
    ])
    expect(slides[4].bullets).toEqual([
      'מה המשימה?',
      'מה חומר הגלם?',
      'מה התוצר?',
      'מה הכי חשוב?',
      'כמה שליטה אני רוצה?',
      'כלי אחד או מסלול?',
    ])
  })

  it('keeps the opening act projection-ready with useful notes and a five-to-eight-minute duration', () => {
    const totalDuration = slides.reduce((sum, slide) => sum + slide.duration, 0)

    expect(totalDuration).toBeGreaterThanOrEqual(5 * 60)
    expect(totalDuration).toBeLessThanOrEqual(8 * 60)
    for (const slide of slides) {
      expect(slide.speakerNotes.length).toBeGreaterThanOrEqual(2)
      expect(slide.speakerNotes.length).toBeLessThanOrEqual(5)
      expect(slide.speakerNotes.every((note) => note.trim().length > 0)).toBe(true)
    }
  })
})

describe('PresentationShell navigation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('moves forward with Right or Down and backward with Left or Up', () => {
    renderPresentation()

    expect(screen.getByRole('heading', { name: 'AI NAVI' })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByRole('heading', { name: toolOverloadTitle })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByRole('heading', { name: 'AI NAVI' })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(screen.getByRole('heading', { name: toolOverloadTitle })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(screen.getByRole('heading', { name: 'AI NAVI' })).toBeInTheDocument()
  })

  it('uses Space and Enter to reveal hidden content before advancing', () => {
    renderPresentation()
    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(screen.getByLabelText('מצב חשיפה')).toHaveTextContent('0 מתוך 3')
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByRole('heading', { name: toolOverloadTitle })).toBeInTheDocument()
    expect(screen.getByLabelText('מצב חשיפה')).toHaveTextContent('1 מתוך 3')
    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByLabelText('מצב חשיפה')).toHaveTextContent('3 מתוך 3')
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByRole('heading', { name: 'הבעיה אינה מחסור בכלים' })).toBeInTheDocument()
  })

  it('jumps to the first and last slide with Home and End', () => {
    renderPresentation()

    fireEvent.keyDown(window, { key: 'End' })
    expect(screen.getByRole('heading', { name: 'שישה צמתים. החלטה אחת טובה יותר.' })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Home' })
    expect(screen.getByRole('heading', { name: 'AI NAVI' })).toBeInTheDocument()
  })

  it('shows current notes, timer, duration, next preview, jump, and reset controls in the presenter drawer', () => {
    renderPresentation()
    fireEvent.keyDown(window, { key: 'n' })

    const drawer = screen.getByRole('complementary', { name: 'הערות מרצה' })
    expect(within(drawer).getByText('שקופית 1 מתוך 5')).toBeInTheDocument()
    expect(within(drawer).getByText('00:00')).toBeInTheDocument()
    expect(within(drawer).getByText('משך מומלץ: 01:00')).toBeInTheDocument()
    expect(within(drawer).getByText('מסר מרכזי: לא צריך להכיר כל כלי; צריך לדעת לנווט.')).toBeInTheDocument()
    expect(within(drawer).getByText(`הבא: ${toolOverloadTitle}`)).toBeInTheDocument()
    expect(within(drawer).getByLabelText('מעבר לשקופית')).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: 'איפוס האינטראקציה בשקופית' })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('complementary', { name: 'הערות מרצה' })).not.toBeInTheDocument()
  })

  it('uses accessible RTL controls that mirror the keyboard behavior', () => {
    renderPresentation()

    expect(screen.getByLabelText('מצגת AI NAVI')).toHaveAttribute('dir', 'rtl')
    fireEvent.click(screen.getByRole('button', { name: 'לשקופית הבאה' }))
    expect(screen.getByRole('heading', { name: toolOverloadTitle })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'לשקופית הקודמת' }))
    expect(screen.getByRole('heading', { name: 'AI NAVI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'הצגת הערות מרצה' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'מעבר למסך מלא' })).toBeInTheDocument()
    expect(screen.getByLabelText('התקדמות במצגת')).toHaveTextContent('1 מתוך 5')
  })

  it('restores a safe versioned slide and reveal position from local storage', () => {
    const firstRender = renderPresentation()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: ' ' })
    firstRender.unmount()

    renderPresentation()
    expect(screen.getByRole('heading', { name: toolOverloadTitle })).toBeInTheDocument()
    expect(screen.getByLabelText('מצב חשיפה')).toHaveTextContent('1 מתוך 3')
  })

  it('does not hijack navigation keys from presenter controls and reports fullscreen failure', async () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error('denied')),
    })
    renderPresentation()
    fireEvent.keyDown(window, { key: 'n' })

    const jump = screen.getByLabelText('מעבר לשקופית')
    fireEvent.keyDown(jump, { key: 'End' })
    expect(screen.getByLabelText('התקדמות במצגת')).toHaveTextContent('1 מתוך 5')

    fireEvent.click(screen.getByRole('button', { name: 'מעבר למסך מלא' }))
    expect(await screen.findByRole('status')).toHaveTextContent('לא ניתן לעבור למסך מלא')
  })
})
