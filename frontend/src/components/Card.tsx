import type { ReactNode } from "react";

export function Card({
  title,
  icon,
  hint,
  actions,
  children,
  tight,
  padded = true,
}: {
  title?: string;
  icon?: ReactNode;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  tight?: boolean;
  padded?: boolean;
}) {
  return (
    <section className="card">
      {(title || actions) && (
        <header className="card__head">
          <div className="card__title">
            {icon}
            <span>{title}</span>
          </div>
          <div className="row-flex">
            {hint && <span className="card__hint">{hint}</span>}
            {actions}
          </div>
        </header>
      )}
      {padded ? (
        <div className={tight ? "card__body card__body--tight" : "card__body"}>
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}