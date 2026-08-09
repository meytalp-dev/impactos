import { aiTools } from '../../data/tools'

type AlternativeKind = 'fast' | 'professional' | 'budget'

const content: Record<AlternativeKind, { title: string; tradeoff: string }> = {
  fast: { title: 'מסלול מהיר', tradeoff: 'חוסך זמן ומקצר את ההקמה, במחיר של פחות שליטה ועומק.' },
  professional: { title: 'מסלול מקצועי', tradeoff: 'משקיע יותר זמן וכלים ייעודיים כדי לשפר איכות ושליטה.' },
  budget: { title: 'מסלול חסכוני', tradeoff: 'מצמצם עלות ומעדיף אפשרויות חינמיות או freemium, עם יותר עבודה ידנית.' },
}

interface AlternativeRouteCardProps {
  kind: AlternativeKind
  toolIds: string[]
  sensitive: boolean
}

export function AlternativeRouteCard({ kind, toolIds, sensitive }: AlternativeRouteCardProps) {
  const { title, tradeoff } = content[kind]
  const tools = toolIds.map((id) => aiTools.find((tool) => tool.id === id)).filter((tool) => tool !== undefined)
  const titleId = `alternative-${kind}`

  return (
    <article className={`navi-alternative navi-alternative--${kind}`} data-alternative-route={kind} aria-labelledby={titleId}>
      <h3 id={titleId}>{title}</h3>
      <p>{tradeoff}</p>
      {sensitive ? (
        <strong>יש לבחור כלי מאושר בארגון</strong>
      ) : (
        <ul>
          {tools.map((tool) => <li key={tool.id} data-alternative-tool={tool.id}>{tool.name}</li>)}
        </ul>
      )}
    </article>
  )
}
