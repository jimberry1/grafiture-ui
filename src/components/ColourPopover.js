import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { fromHex, toHex } from "../colours"

const WIDTH = 272
const MARGIN = 12

// Picks the paint a matched colour is sprayed as: any colour, one of the user's saved
// paints, or another palette colour (which merges the two into one sheet).
export default function ColourPopover({ anchor, title, value, original, paints, others, onPick, onReset, onClose }) {
  const panel = useRef(null)
  const [position, setPosition] = useState({ left: -9999, top: -9999 })
  const [hexText, setHexText] = useState(toHex(value))

  useEffect(() => setHexText(toHex(value)), [value])

  useLayoutEffect(() => {
    const place = () => {
      const rect = anchor.getBoundingClientRect()
      const height = panel.current?.offsetHeight || 300
      const left = Math.max(MARGIN, Math.min(rect.left - WIDTH + rect.width, window.innerWidth - WIDTH - MARGIN))
      const below = rect.bottom + 8
      const top = below + height + MARGIN <= window.innerHeight ? below : Math.max(MARGIN, rect.top - height - 8)
      setPosition({ left, top })
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [anchor])

  useEffect(() => {
    const away = (e) => !panel.current?.contains(e.target) && !anchor.contains(e.target) && onClose()
    const key = (e) => e.key === "Escape" && onClose()
    document.addEventListener("mousedown", away)
    window.addEventListener("keydown", key)
    panel.current?.querySelector("input")?.focus()
    return () => {
      document.removeEventListener("mousedown", away)
      window.removeEventListener("keydown", key)
    }
  }, [anchor, onClose])

  const typeHex = (text) => {
    setHexText(text)
    const clean = text.trim().replace(/^#?/, "#")
    if (/^#[0-9a-f]{6}$/i.test(clean)) onPick(fromHex(clean))
  }

  const chip = (label, rgb, key) => (
    <button key={key} type="button" className={`paint-chip${toHex(rgb) === toHex(value) ? " is-current" : ""}`} onClick={() => onPick(rgb)}>
      <i style={{ background: toHex(rgb) }} /> {label}
    </button>
  )

  return createPortal(
    <div ref={panel} className="colour-popover" role="dialog" aria-label={title} style={{ width: WIDTH, ...position }}>
      <div className="colour-popover-head">
        <strong>{title}</strong>
        <span className="field-hint">Matches <i className="mini-swatch" style={{ background: toHex(original) }} /> {toHex(original)}</span>
      </div>

      <div className="colour-popover-custom">
        <label className="swatch swatch-lg" style={{ background: toHex(value) }}>
          <input type="color" aria-label="Custom colour" value={toHex(value)} onChange={(e) => onPick(fromHex(e.target.value))} />
        </label>
        <div className="paint-form-fields">
          <input className="text-input mono" aria-label="Hex colour" value={hexText} onChange={(e) => typeHex(e.target.value)} />
          <span className="field-hint">Pick any colour, or type a hex code</span>
        </div>
      </div>

      {paints.length > 0 && (
        <>
          <div className="subhead">Your paints</div>
          <div className="paint-chips">{paints.map((p) => chip(p.name, p.rgb, `p-${p.id}`))}</div>
        </>
      )}

      {others.length > 0 && (
        <>
          <div className="subhead">Same as another colour</div>
          <div className="paint-chips">{others.map((c) => chip(c.name, c.rgb, `o-${c.id}`))}</div>
          <span className="field-hint">Sharing a paint merges them: one sheet fewer.</span>
        </>
      )}

      <div className="colour-popover-foot">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>Keep the original colour</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Done</button>
      </div>
    </div>,
    document.body
  )
}
