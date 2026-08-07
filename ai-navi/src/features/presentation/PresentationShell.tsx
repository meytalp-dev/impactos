import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SlideDefinition } from '../../lib/presentationTypes'
import { clampRevealIndex, clampSlideIndex } from '../../lib/presentationTypes'
import { PresentationControls } from './PresentationControls'
import { PresenterNotes } from './PresenterNotes'
import { SlideRenderer } from './SlideRenderer'

const PRESENTATION_STATE_KEY = 'ai-navi:presentation-state:v1'

type PresentationPosition = {
  slideIndex: number
  revealIndex: number
}

function loadPosition(slides: SlideDefinition[]): PresentationPosition {
  if (typeof localStorage === 'undefined') return { slideIndex: 0, revealIndex: 0 }
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PRESENTATION_STATE_KEY) ?? 'null')
    if (!value || typeof value !== 'object') return { slideIndex: 0, revealIndex: 0 }
    const state = value as Record<string, unknown>
    if (state.version !== 1 || typeof state.slideIndex !== 'number' || typeof state.revealIndex !== 'number') {
      return { slideIndex: 0, revealIndex: 0 }
    }
    const slideIndex = clampSlideIndex(state.slideIndex, slides.length)
    const revealCount = slides[slideIndex]?.revealSteps?.length ?? 0
    return { slideIndex, revealIndex: clampRevealIndex(state.revealIndex, revealCount) }
  } catch {
    return { slideIndex: 0, revealIndex: 0 }
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('a, button, input, select, textarea, [contenteditable="true"], [role="button"], [role="combobox"], [role="slider"], [role="textbox"]'))
}

export function PresentationShell({ slides }: { slides: SlideDefinition[] }) {
  const initialPosition = useMemo(() => loadPosition(slides), [slides])
  const [slideIndex, setSlideIndex] = useState(initialPosition.slideIndex)
  const [revealIndex, setRevealIndex] = useState(initialPosition.revealIndex)
  const [notesOpen, setNotesOpen] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [fullscreenMessage, setFullscreenMessage] = useState('')
  const startedAt = useRef(Date.now())
  const slide = slides[slideIndex]
  const revealCount = slide?.revealSteps?.length ?? 0

  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(PRESENTATION_STATE_KEY, JSON.stringify({ version: 1, slideIndex, revealIndex }))
    } catch {
      // Presentation remains fully usable if storage is unavailable.
    }
  }, [revealIndex, slideIndex])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const jumpTo = useCallback((index: number) => {
    setSlideIndex(clampSlideIndex(index, slides.length))
    setRevealIndex(0)
  }, [slides.length])

  const previous = useCallback(() => jumpTo(slideIndex - 1), [jumpTo, slideIndex])
  const next = useCallback(() => jumpTo(slideIndex + 1), [jumpTo, slideIndex])

  const revealOrAdvance = useCallback(() => {
    if (revealIndex < revealCount) {
      setRevealIndex((current) => clampRevealIndex(current + 1, revealCount))
      return
    }
    next()
  }, [next, revealCount, revealIndex])

  const requestFullscreen = useCallback(() => {
    setFullscreenMessage('')
    const request = document.documentElement.requestFullscreen
    if (!request) {
      setFullscreenMessage('לא ניתן לעבור למסך מלא בדפדפן הזה')
      return
    }
    try {
      void request.call(document.documentElement).catch(() => {
        setFullscreenMessage('לא ניתן לעבור למסך מלא')
      })
    } catch {
      setFullscreenMessage('לא ניתן לעבור למסך מלא')
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && notesOpen) {
        event.preventDefault()
        setNotesOpen(false)
        return
      }
      if (isInteractiveTarget(event.target)) return

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        previous()
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        revealOrAdvance()
      } else if (event.key === 'Home') {
        event.preventDefault()
        jumpTo(0)
      } else if (event.key === 'End') {
        event.preventDefault()
        jumpTo(slides.length - 1)
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setNotesOpen((open) => !open)
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        requestFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [jumpTo, next, notesOpen, previous, requestFullscreen, revealOrAdvance, slides.length])

  if (!slide) return null

  return (
    <section className="navi-presentation-shell" dir="rtl" aria-label="מצגת AI NAVI">
      <div className="navi-presentation-stage-frame">
        <SlideRenderer slide={slide} revealIndex={revealIndex} slideNumber={slideIndex + 1} totalSlides={slides.length} />
        {revealCount > 0 && (
          <span className="navi-reveal-status" aria-label="מצב חשיפה">{revealIndex} מתוך {revealCount}</span>
        )}
      </div>

      <PresentationControls
        currentIndex={slideIndex}
        total={slides.length}
        notesOpen={notesOpen}
        hasPendingReveals={revealIndex < revealCount}
        onPrevious={previous}
        onNext={revealOrAdvance}
        onToggleNotes={() => setNotesOpen((open) => !open)}
        onFullscreen={requestFullscreen}
      />

      {notesOpen && (
        <PresenterNotes
          slide={slide}
          slides={slides}
          currentIndex={slideIndex}
          elapsedSeconds={elapsedSeconds}
          nextSlide={slides[slideIndex + 1]}
          onJump={jumpTo}
          onReset={() => setRevealIndex(0)}
          onClose={() => setNotesOpen(false)}
        />
      )}
      {fullscreenMessage && <p className="navi-presentation-status" role="status">{fullscreenMessage}</p>}
    </section>
  )
}
