import type { HTMLAttributes, ReactNode } from 'react'

type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions, className = '', ...props }: PageHeaderProps) {
  return (
    <header className={`navi-page-header ${className}`.trim()} {...props}>
      <div className="navi-page-header__copy">
        {eyebrow ? <p className="navi-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="navi-page-header__title">{title}</h1>
        {description ? <p className="navi-page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="navi-page-header__actions">{actions}</div> : null}
    </header>
  )
}
