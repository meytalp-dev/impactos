import { slides } from '../data/slides'
import { PresentationShell } from '../features/presentation/PresentationShell'

export default function PresentationPage() {
  return (
    <div className="navi-presentation-page">
      <h1 className="navi-visually-hidden">בניית מצגת</h1>
      <PresentationShell slides={slides} />
    </div>
  )
}
