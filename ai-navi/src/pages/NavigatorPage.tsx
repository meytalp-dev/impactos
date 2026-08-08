import { NavigatorIntro } from '../features/navigator/NavigatorIntro'
import { PrivacyGate } from '../features/navigator/PrivacyGate'
import { QuestionStep } from '../features/navigator/QuestionStep'
import { useNavigator } from '../features/navigator/NavigatorProvider'

export default function NavigatorPage() {
  const { mode } = useNavigator()
  return (
    <>
      <h2 className="navi-sr-only">התחלת ניווט</h2>
      {mode === 'intro' ? <NavigatorIntro /> : mode === 'privacy-gate' ? <PrivacyGate /> : <QuestionStep />}
    </>
  )
}
