import { useEffect, useMemo, useRef, useState } from "react"
import { jobFileUrl } from "../api"
import { sameColour, toHex } from "../colours"
import { composite, readMask } from "../composite"
import ColourPopover from "./ColourPopover"
import { Close, Download } from "./Icons"

const KIND_LABEL = { layer: "Layer", final: "Final pass", sheet: "Sheet", base: "Base coat", "touch-up": "Touch-up", "cover-up": "Cover-up" }

// Masks are the same for every view of a job, so they are read once.
const maskCache = new Map()

function loadMask(jobId, file, width, height, margin) {
  const key = `${jobId}/${file}`
  if (!maskCache.has(key)) {
    maskCache.set(key, new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(readMask(img, width, height, margin))
      img.onerror = () => reject(new Error(`Could not load ${file}`))
      img.src = jobFileUrl(jobId, file)
    }))
  }
  return maskCache.get(key)
}

// Sprays the selected sheets in order, in the browser, with any paints swapped, so you
// can see the finished piece before cutting or buying paint.
export default function SprayPreview({ jobId, manifest, selected, onToggle, onSelectAll, colours, onColour, onResetColours, onApply, paints, onClose }) {
  const { width, height, margin, sheets, palette } = manifest
  const canvas = useRef(null)
  const [masks, setMasks] = useState(null)
  const [error, setError] = useState(null)
  const [picking, setPicking] = useState(null) // { key, anchor }

  useEffect(() => {
    let live = true
    Promise.all(sheets.filter((s) => s.file).map((s) => loadMask(jobId, s.file, width, height, margin).then((m) => [s.file, m])))
      .then((pairs) => live && setMasks(Object.fromEntries(pairs)))
      .catch((e) => live && setError(e.message))
    return () => { live = false }
  }, [jobId, sheets, width, height, margin])

  useEffect(() => {
    const key = (e) => e.key === "Escape" && !picking && onClose()
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [onClose, picking])

  const colourOf = (key) => colours[key] || palette[key]
  const used = useMemo(() => [...new Set(sheets.map((s) => s.colour))], [sheets])

  useEffect(() => {
    if (!masks || !canvas.current) return
    const frame = requestAnimationFrame(() => {
      const pixels = composite({
        width, height, masks,
        sheets: sheets.filter((s) => selected.has(s.order)),
        colourOf: (s) => colourOf(s.colour),
      })
      const ctx = canvas.current.getContext("2d")
      ctx.putImageData(new ImageData(pixels, width, height), 0, 0)
    })
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masks, selected, colours, width, height, sheets])

  const changed = used.filter((k) => colours[k] && !sameColour(colours[k], palette[k]))
  const download = () => {
    const a = document.createElement("a")
    a.href = canvas.current.toDataURL("image/png")
    a.download = "spray-preview.png"
    a.click()
  }

  return (
    <div className="lightbox spray-preview" role="dialog" aria-modal="true" aria-label="Spray preview">
      <div className="lightbox-bar">
        <strong>Spray preview <span className="muted" style={{ fontWeight: 400 }}>· {selected.size} of {sheets.length} sheets</span></strong>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={download} disabled={!masks}><Download size={14} /> PNG</button>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Close /></button>
        </div>
      </div>
      <div className="spray-body">
        <div className="spray-stage">
          {error ? <div className="alert">{error}</div> : !masks ? <span className="spinner" /> : null}
          <canvas ref={canvas} width={width} height={height} style={masks ? undefined : { display: "none" }} />
        </div>

        <aside className="spray-side">
          <section>
            <div className="subhead">
              Sheets
              <span>
                <button type="button" onClick={() => onSelectAll(true)}>All</button>{" · "}
                <button type="button" onClick={() => onSelectAll(false)}>None</button>
              </span>
            </div>
            <div className="spray-sheets">
              {sheets.map((s) => (
                <label key={s.order} className={`spray-sheet${selected.has(s.order) ? "" : " is-off"}`}>
                  <input type="checkbox" checked={selected.has(s.order)} onChange={() => onToggle(s.order)} />
                  <span className="spray-order">{s.order}</span>
                  <i className="mini-swatch" style={{ background: toHex(colourOf(s.colour)) }} />
                  <span className="spray-name">{s.name}</span>
                  <span className="badge">{KIND_LABEL[s.kind] || s.kind}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <div className="subhead">
              Paints
              {changed.length > 0 && <span><button type="button" onClick={onResetColours}>Reset</button></span>}
            </div>
            <div className="spray-paints">
              {used.map((k) => (
                <div key={k} className="spray-paint">
                  <button type="button" className={`swatch spray-swatch${colours[k] && !sameColour(colours[k], palette[k]) ? " is-mapped" : ""}`}
                    style={{ background: toHex(colourOf(k)) }} aria-label={`Change ${k}`}
                    onClick={(e) => setPicking({ key: k, anchor: e.currentTarget })} />
                  <span className="spray-name">{k}</span>
                  <span className="swatch-hex">{toHex(colourOf(k))}</span>
                </div>
              ))}
            </div>
            <p className="field-hint">Changing a paint here only changes this preview. Use these colours to carry them into your palette, then create the stencil again.</p>
            <button type="button" className="btn btn-primary btn-sm btn-block" disabled={changed.length === 0} onClick={() => onApply(changed.map((k) => ({ from: palette[k], to: colours[k] })))}>
              Use these colours
            </button>
          </section>
        </aside>
      </div>

      {picking && (
        <ColourPopover
          anchor={picking.anchor}
          title={`Spray ${picking.key} as`}
          value={colourOf(picking.key)}
          original={palette[picking.key]}
          paints={paints}
          others={used.filter((k) => k !== picking.key).map((k) => ({ id: k, name: k, rgb: colourOf(k) }))}
          onPick={(rgb) => onColour(picking.key, rgb)}
          onReset={() => { onColour(picking.key, null); setPicking(null) }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}
