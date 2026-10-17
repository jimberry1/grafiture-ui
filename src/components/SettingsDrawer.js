import { useState } from "react"
import { fromHex, toHex } from "../colours"
import Drawer from "./Drawer"
import { Palette, Plus, Trash } from "./Icons"

let nextPaintId = Date.now()

// Settings: the paints the user owns, by name and RGB. Saved in this browser.
export default function SettingsDrawer({ paints, palette, onPaints, onClose }) {
  const [name, setName] = useState("")
  const [hex, setHex] = useState("#1c3060")
  const [rgbText, setRgbText] = useState("28, 48, 96")

  const setFromHex = (value) => {
    setHex(value)
    setRgbText(fromHex(value).join(", "))
  }

  const setFromRgb = (text) => {
    setRgbText(text)
    const parts = text.split(/[\s,]+/).filter(Boolean).map(Number)
    if (parts.length === 3 && parts.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) setHex(toHex(parts))
  }

  const add = (e) => {
    e.preventDefault()
    const label = name.trim() || toHex(fromHex(hex)).toUpperCase()
    onPaints([...paints, { id: nextPaintId++, name: label, rgb: fromHex(hex) }])
    setName("")
  }

  const update = (id, patch) => onPaints(paints.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const saveCurrentPalette = () => {
    const known = new Set(paints.map((p) => toHex(p.rgb)))
    const fresh = palette.filter((c) => !known.has(toHex(c.rgb))).map((c) => ({ id: nextPaintId++, name: c.name, rgb: c.rgb }))
    onPaints([...paints, ...fresh])
  }

  return (
    <Drawer title="Settings" subtitle="Saved in this browser only" onClose={onClose}>
      <section className="settings-section">
        <h3><Palette size={16} /> My paints</h3>
        <p className="field-hint">The spray paints you own, by exact colour. Pick them straight into a palette, and colours that match one take its name.</p>

        <form className="paint-form" onSubmit={add}>
          <label className="swatch swatch-lg" style={{ background: hex }}>
            <input type="color" aria-label="Paint colour" value={hex} onChange={(e) => setFromHex(e.target.value)} />
          </label>
          <div className="paint-form-fields">
            <input className="text-input" placeholder="Name, e.g. Montana Shock Blue" value={name} onChange={(e) => setName(e.target.value)} aria-label="Paint name" />
            <input className="text-input mono" value={rgbText} onChange={(e) => setFromRgb(e.target.value)} aria-label="RGB values" placeholder="R, G, B" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm"><Plus size={14} /> Add</button>
        </form>

        {paints.length === 0 ? (
          <div className="empty-hint">No paints saved yet. Add the colours you have, or save the current palette.</div>
        ) : (
          <div className="swatches">
            {paints.map((p) => (
              <div key={p.id} className="swatch-row">
                <span className="swatch" style={{ background: toHex(p.rgb) }}>
                  <input type="color" aria-label={`Edit ${p.name}`} value={toHex(p.rgb)} onChange={(e) => update(p.id, { rgb: fromHex(e.target.value) })} />
                </span>
                <input className="swatch-name" aria-label="Paint name" defaultValue={p.name} key={p.name}
                  onBlur={(e) => update(p.id, { name: e.target.value.trim() || p.name })} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} />
                <span className="swatch-hex">{p.rgb.join(" ")}</span>
                <button type="button" className="icon-btn" aria-label={`Delete ${p.name}`} onClick={() => onPaints(paints.filter((x) => x.id !== p.id))}>
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: "var(--space-3)" }}
          disabled={palette.length === 0} onClick={saveCurrentPalette}>
          Save current palette as paints
        </button>
      </section>
    </Drawer>
  )
}
