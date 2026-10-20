import { useState } from "react"
import { fromHex, grey, invert, mergedGroups, nameFor, paletteEntry, sameColour, shuffled, slug, sprayed, toHex } from "../colours"
import ColourPopover from "./ColourPopover"
import { Slider } from "./Controls"
import { ArrowRight, Copy, Pipette, Sparkle, Trash } from "./Icons"

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
  const [picking, setPicking] = useState(null) // { id, anchor }

  const update = (id, patch) => onChange(palette.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  // a colour changed with the picker is renamed to match its new value
  const recolour = (id, rgb) => {
    const taken = palette.filter((c) => c.id !== id).map((c) => c.name)
    update(id, { rgb, name: nameFor(rgb, taken, paints) })
  }

  // the paint a colour is sprayed as; the same as the colour it matches means no mapping
  const setSprayed = (id, rgb) => {
    const c = palette.find((p) => p.id === id)
    update(id, { mapTo: rgb && !sameColour(rgb, c.rgb) ? rgb : undefined })
  }
  const recolourAll = (f) => onChange(palette.map((c) => {
    const rgb = f(c)
    return { ...c, mapTo: rgb && !sameColour(rgb, c.rgb) ? rgb : undefined }
  }))
  const anyMapped = palette.some((c) => c.mapTo)
  const merges = mergedGroups(palette)
  const pickingColour = picking && palette.find((c) => c.id === picking.id)

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
          <div className="swatch-head" aria-hidden="true">
            <span>Matches</span>
            <span />
            <span>Sprayed as</span>
          </div>
          {palette.map((c) => (
            <div key={c.id} className="swatch-row recolour-row">
              <span className="swatch" style={{ background: toHex(c.rgb) }} title={`Matches ${toHex(c.rgb)}`}>
                <input type="color" aria-label={`Edit ${c.name}`} value={toHex(c.rgb)} onChange={(e) => recolour(c.id, fromHex(e.target.value))} />
              </span>
              <input className="swatch-name" aria-label="Colour name" defaultValue={c.name} key={c.name}
                onBlur={(e) => rename(c.id, e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} />
              <ArrowRight size={14} className="recolour-arrow" />
              <button type="button" className={`swatch spray-swatch${c.mapTo ? " is-mapped" : ""}`}
                style={{ background: toHex(sprayed(c)) }}
                aria-label={c.mapTo ? `${c.name} is sprayed as ${toHex(c.mapTo)}; change` : `Spray ${c.name} as another colour`}
                aria-expanded={picking?.id === c.id}
                onClick={(e) => setPicking(picking?.id === c.id ? null : { id: c.id, anchor: e.currentTarget })}>
                {!c.mapTo && <span className="spray-same">=</span>}
              </button>
              <button type="button" className="icon-btn" aria-label={`Remove ${c.name}`} onClick={() => onChange(palette.filter((p) => p.id !== c.id))}>
                <Trash size={16} />
              </button>
            </div>
          ))}

          <div className="recolour-bar">
            <span className="field-label">Recolour</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(shuffled(palette))} disabled={palette.length < 2}>Shuffle</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => recolourAll((c) => invert(c.rgb))}>Invert</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => recolourAll((c) => grey(c.rgb))}>Greyscale</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => recolourAll(() => null)} disabled={!anyMapped}>Reset</button>
          </div>

          <div className="palette-strip" aria-hidden="true">
            {palette.map((c) => <span key={c.id} style={{ background: toHex(sprayed(c)) }} />)}
          </div>
          {merges.map((group) => (
            <p key={group.map((c) => c.id).join()} className="field-hint merge-note">
              <i className="mini-swatch" style={{ background: toHex(sprayed(group[0])) }} />
              {group.map((c) => c.name).join(" and ")} share a paint, so they share a sheet.
            </p>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-2)" }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={copyEdn}>
              <Copy size={14} /> {copied ? "Copied" : "Copy as EDN"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([])}>Clear</button>
          </div>
        </div>
      )}

      {pickingColour && (
        <ColourPopover
          anchor={picking.anchor}
          title={`Spray ${pickingColour.name} as`}
          value={sprayed(pickingColour)}
          original={pickingColour.rgb}
          paints={paints}
          others={palette.filter((c) => c.id !== pickingColour.id).map((c) => ({ id: c.id, name: c.name, rgb: sprayed(c) }))}
          onPick={(rgb) => setSprayed(pickingColour.id, rgb)}
          onReset={() => { setSprayed(pickingColour.id, null); setPicking(null) }}
          onClose={() => setPicking(null)}
        />
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
