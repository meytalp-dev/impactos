import type { HTMLAttributes, ReactNode } from 'react'

export type NoticeTone = 'info' | 'warning' | 'risk' | 'success'

type NoticeProps = HTMLAttributes<HTMLElement> & {
  tone: NoticeTone
  title: string
  children: ReactNode
}

const noticeLabels: Record<NoticeTone, string> = {
  info: 'מידע',
  warning: 'שימו לב',
  risk: 'סיכון',
  success: 'בוצע',
}

export function Notice({ tone, title, children, className = '', ...props }: NoticeProps) {
  return (
    <aside className={`navi-notice navi-notice--${tone} ${className}`.trim()} role="alert" {...props}>
      <span className="navi-notice__tone">{noticeLabels[tone]}</span>
      <div>
        <h2 className="navi-notice__title">{title}</h2>
        <div className="navi-notice__body">{children}</div>
      </div>
    </aside>
  )
}
