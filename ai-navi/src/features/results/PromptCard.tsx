import { useRef, useState } from 'react'

type CopyState = 'idle' | 'success' | 'manual'

export function PromptCard({ prompt }: { prompt: string }) {
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const [copyState, setCopyState] = useState<CopyState>('idle')

  const selectForManualCopy = () => {
    promptRef.current?.focus()
    promptRef.current?.select()
    setCopyState('manual')
  }

  const copyPrompt = async () => {
    setCopyState('idle')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(prompt)
      setCopyState('success')
    } catch {
      selectForManualCopy()
    }
  }

  return (
    <section className="navi-prompt-card" aria-labelledby="starter-prompt-title">
      <div className="navi-prompt-card__heading">
        <div>
          <p className="navi-results__eyebrow">נקודת פתיחה</p>
          <h2 id="starter-prompt-title">פרומפט מוכן לעבודה</h2>
        </div>
        <button type="button" className="navi-action navi-action--primary navi-prompt-card__copy" onClick={copyPrompt}>
          העתקת הפרומפט
        </button>
      </div>
      <textarea
        ref={promptRef}
        className="navi-prompt-card__text"
        aria-label="פרומפט מוכן להעתקה"
        value={prompt}
        readOnly
        rows={8}
      />
      <pre className="navi-print-only navi-prompt-card__print-text">{prompt}</pre>
      <p className="navi-prompt-card__status" role="status" aria-live="polite">
        {copyState === 'success' ? 'הפרומפט הועתק ללוח.' : null}
        {copyState === 'manual' ? 'העתקה אוטומטית לא הצליחה. הפרומפט סומן — העתיקו אותו ידנית.' : null}
      </p>
    </section>
  )
}
