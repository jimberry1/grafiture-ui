import { useEffect, useRef, useState } from "react"
import { samplerFor, toHex } from "../colours"
import { Logo, Pipette } from "./Icons"

const LOUPE_ZOOM = 8
const LOUPE_SIZE = 112

// An image the user can pick colours from, with a magnifying loupe under the cursor.
function PickableImage({ url, picking, pixelated, onPick }) {
  const img = useRef(null)
  const [loupe, setLoupe] = useState(null)
  const [sampler, setSampler] = useState(null)

  useEffect(() => {
    let live = true
    setSampler(null)
    if (picking && url) samplerFor(url).then((s) => live && setSampler(s), () => {})
    return () => { live = false }
  }, [url, picking])

  const pixelAt = (e) => {
    const rect = img.current.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * sampler.width)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * sampler.height)
    return { x: Math.min(sampler.width - 1, Math.max(0, x)), y: Math.min(sampler.height - 1, Math.max(0, y)) }
  }

  const move = (e) => {
    if (!sampler) return
    const { x, y } = pixelAt(e)
    setLoupe({ clientX: e.clientX, clientY: e.clientY, x, y, rgb: sampler.at(x, y) })
  }

  const loupeStyle = loupe && sampler && {
    left: loupe.clientX - LOUPE_SIZE / 2,
    top: loupe.clientY - LOUPE_SIZE - 28,
    backgroundImage: `url(${url})`,
    backgroundSize: `${sampler.width * LOUPE_ZOOM}px ${sampler.height * LOUPE_ZOOM}px`,
    backgroundPosition: `${LOUPE_SIZE / 2 - (loupe.x + 0.5) * LOUPE_ZOOM}px ${LOUPE_SIZE / 2 - (loupe.y + 0.5) * LOUPE_ZOOM}px`,
  }

  return (
    <div className="stage-image-wrap">
      <img
        ref={img}
        src={url}
        alt=""
        className={`stage-image${picking ? " is-picking" : ""}${pixelated ? " is-pixelated" : ""}`}
        onMouseMove={picking ? move : undefined}
        onMouseLeave={() => setLoupe(null)}
        onClick={picking && sampler ? (e) => { const { x, y } = pixelAt(e); onPick(sampler.at(x, y)) } : undefined}
        draggable={false}
      />
      {loupe && picking && (
        <div className="loupe" style={loupeStyle}>
          <span className="loupe-label"><i style={{ background: toHex(loupe.rgb) }} />{toHex(loupe.rgb)}</span>
        </div>
      )}
    </div>
  )
}

export default function Stage({ tabs, tab, onTab, loading, children, hint }) {
  return (
    <section className="stage" aria-label="Image stage">
      <div className="stage-bar">
        <div className="tabs" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" className="tab" aria-selected={tab === t.id} disabled={t.disabled} onClick={() => onTab(t.id)}>
              {t.label}
              {t.badge != null && <span className="badge">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="stage-view">
        {children}
        {loading && <span className="stage-loading"><span className="spinner" /> {loading}</span>}
      </div>
      <div className="stage-hint">{hint}</div>
    </section>
  )
}

Stage.Image = PickableImage

Stage.Empty = function Empty() {
  return (
    <div className="stage-empty">
      <span className="brand-mark" style={{ width: 48, height: 48, borderRadius: 14 }}><Logo size={26} /></span>
      <h2>Turn any image into spray stencils</h2>
      <p>Drop an image, pick a style and a few colours, and get a set of cuttable sheets that hold together, ready to spray in order.</p>
    </div>
  )
}

Stage.PickHint = function PickHint() {
  return <><Pipette size={14} /> Click the image to add a colour · hover to inspect pixels</>
}
