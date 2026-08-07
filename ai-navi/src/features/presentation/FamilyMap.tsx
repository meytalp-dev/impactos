import { useEffect, useState } from 'react'
import type { FamilyMapVisual } from '../../lib/presentationTypes'

type FamilyMapProps = {
  data: FamilyMapVisual
  resetToken: number
}

export function FamilyMap({ data, resetToken }: FamilyMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    setSelectedId(null)
  }, [resetToken])

  const selected = data.families.find((family) => (family.id ?? family.name) === selectedId)

  return (
    <div className="navi-family-map">
      <div className="navi-slide-families__map" role="group" aria-label="מפת משפחות כלים">
        {data.families.map((family, index) => {
          const id = family.id ?? family.name
          return (
            <button
              className={`navi-slide-families__station navi-slide-families__station--${family.line}`}
              key={id}
              type="button"
              aria-pressed={selectedId === id}
              onClick={() => setSelectedId(id)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{family.name}</strong>
              <small>{selectedId === id ? 'נבחרה · הצגת שימוש' : 'בחירת תחנה'}</small>
            </button>
          )
        })}
      </div>
      {selected && (
        <section className="navi-family-map__detail" role="region" aria-label={`שימוש במשפחת ${selected.name}`} aria-live="polite">
          <strong>{selected.name}</strong>
          <p>{selected.use}</p>
        </section>
      )}
      {data.message && <p className="navi-slide-families__message">{data.message}</p>}
    </div>
  )
}
