import { useState } from "react"
import { fromHex, nameFor, paletteEntry, slug, toHex } from "../colours"
import { Slider } from "./Controls"
import { Copy, Pipette, Sparkle, Trash } from "./Icons"

// Detail is the inverse of the server's min-region-size: higher keeps smaller regions.
export const DETAIL_LEVELS = [
  { label: "Bold", minRegionSize: 120 },
  { label: "Simple", minRegionSize: 48 },
  { label: "Balanced", minRegionSize: null },
  { label: "Fine", minRegionSize: 6 },
  { label: "Every pixel", minRegionSize: 0 },
]

export default function PaletteStep({ palette, paints, regions, suggesting, detail, onSuggest, onChange, onDetail, onManagePaints }) {
  const [count, setCount] = useState(4)
  const [copied, setCopied] = useState(false)

  const update = (id, patch) => onChange(palette.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  // a colour changed with the picker is renamed to match its new value
  const recolour = (id, rgb) => {
    const taken = palette.filter((c) => c.id !== id).map((c) => c.name)
    update(id, { rgb, name: nameFor(rgb, taken, paints) })
  }

  const inPalette = new Set(palette.map((c) => toHex(c.rgb)))
  const addPaint = (paint) =>
    onChange([...palette, paletteEntry(paint.rgb, palette.map((c) => c.name), [paint])])

  const rename = (id, raw) => {
    const name = slug(raw) || "colour"
    const taken = palette.filter((c) => c.id !== id).map((c) => c.name)
    let unique = name
    for (let i = 2; taken.includes(unique); i++) unique = `${name}-${i}`
    update(id, { name: unique })
  }

  const copyEdn = () => {
    const edn = "{" + palette.map((c) => `:${c.name} [${c.rgb.join(" ")}]`).join("\n ") + "}"
    navigator.clipboard.writeText(edn)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <>
      <div className="subhead">
        My paints
        <button type="button" onClick={onManagePaints}>{paints.length ? "Manage" : "Add paints"}</button>
      </div>
      {paints.length ? (
        <div className="paint-chips">
          {paints.map((p) => (
            <button key={p.id} type="button" className="paint-chip" disabled={inPalette.has(toHex(p.rgb))}
              title={inPalette.has(toHex(p.rgb)) ? `${p.name} is in the palette` : `Add ${p.name}`} onClick={() => addPaint(p)}>
              <i style={{ background: toHex(p.rgb) }} /> {p.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="field-hint" style={{ margin: "0 0 var(--space-3)" }}>Save the paints you own in Settings to pick them here.</p>
      )}

      <div className="subhead">From the image</div>
      <div className="palette-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onSuggest(count)} disabled={suggesting}>
          {suggesting ? <span className="spinner" /> : <Sparkle size={15} />}
          Suggest {count}
        </button>
        <span style={{ display: "flex", gap: 2 }}>
          {[2, 3, 4, 5, 6].map((n) => (
            <button key={n} type="button" className="btn btn-ghost btn-sm" aria-pressed={count === n}
              style={count === n ? { color: "var(--text)", background: "var(--surface-2)" } : undefined}
              onClick={() => setCount(n)}>
              {n}
            </button>
          ))}
        </span>
      </div>

      {palette.length === 0 ? (
        <div className="empty-hint">
          <Pipette size={18} />
          <span>Click anywhere on the image to pick a colour, or let grafiture suggest a palette. Each colour becomes a spray colour.</span>
        </div>
      ) : (
        <div className="swatches">
          {palette.map((c) => (
            <div key={c.id} className="swatch-row">
              <span className="swatch" style={{ background: toHex(c.rgb) }}>
                <input type="color" aria-label={`Edit ${c.name}`} value={toHex(c.rgb)} onChange={(e) => recolour(c.id, fromHex(e.target.value))} />
              </span>
              <input className="swatch-name" aria-label="Colour name" defaultValue={c.name} key={c.name}
                onBlur={(e) => rename(c.id, e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} />
              <span className="swatch-hex">{toHex(c.rgb)}</span>
              <button type="button" className="icon-btn" aria-label={`Remove ${c.name}`} onClick={() => onChange(palette.filter((p) => p.id !== c.id))}>
                <Trash size={16} />
              </button>
            </div>
          ))}
          <div className="palette-strip" aria-hidden="true">
            {palette.map((c) => <span key={c.id} style={{ background: toHex(c.rgb) }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-2)" }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={copyEdn}>
              <Copy size={14} /> {copied ? "Copied" : "Copy as EDN"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([])}>Clear</button>
          </div>
        </div>
      )}

      <div className="style-options">
        <Slider
          label="Detail"
          min={0}
          max={DETAIL_LEVELS.length - 1}
          value={detail}
          format={(v) => DETAIL_LEVELS[v].label}
          hint={regions != null ? `${regions.toLocaleString()} regions after cleanup. Fewer regions mean simpler, sturdier sheets.` : "Merges specks into their surroundings so sheets stay cuttable."}
          onChange={onDetail}
        />
      </div>
    </>
  )
}
