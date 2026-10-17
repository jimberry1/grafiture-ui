import { useEffect, useRef } from "react"
import { Close } from "./Icons"

// A panel that slides in from the right, over a dimmed backdrop. Escape or a click on
// the backdrop closes it; focus moves into it on open.
export default function Drawer({ title, subtitle, onClose, children, footer }) {
  const panel = useRef(null)

  useEffect(() => {
    const key = (e) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", key)
    panel.current?.focus()
    return () => window.removeEventListener("keydown", key)
  }, [onClose])

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside ref={panel} className="drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Close /></button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </div>
  )
}
