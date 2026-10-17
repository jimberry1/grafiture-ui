import { useRef, useState } from "react"
import { Segmented } from "./Controls"
import { Upload } from "./Icons"

export const SIZE_OPTIONS = [
  { value: 800, label: "800" },
  { value: 1200, label: "1200" },
  { value: 1600, label: "1600" },
  { value: null, label: "Full" },
]

export default function ImageStep({ file, fileUrl, dims, maxSize, onFile, onMaxSize }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)

  const accept = (files) => {
    const picked = Array.from(files || []).find((f) => f.type.startsWith("image/"))
    if (picked) onFile(picked)
  }

  return (
    <>
      {file ? (
        <div className="file-card">
          <img src={fileUrl} alt="" />
          <div className="file-card-meta">
            <strong>{file.name}</strong>
            <span className="muted mono" style={{ fontSize: "var(--text-xs)" }}>
              {dims ? `${dims.w} × ${dims.h}` : "…"} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current.click()}>
            Replace
          </button>
        </div>
      ) : (
        <div
          className={`dropzone${over ? " is-over" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => input.current.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); accept(e.dataTransfer.files) }}
        >
          <span className="dropzone-icon"><Upload size={28} /></span>
          <strong>Drop an image, or click to browse</strong>
          <span className="field-hint">PNG or JPEG. Flat colours and strong shapes work best.</span>
        </div>
      )}
      <input ref={input} className="visually-hidden" type="file" accept="image/*" onChange={(e) => accept(e.target.files)} />

      <div className="field" style={{ marginTop: "var(--space-4)" }}>
        <span className="field-head">
          <span className="field-label">Working size</span>
          <span className="field-value">longest side, px</span>
        </span>
        <Segmented label="Working size" options={SIZE_OPTIONS} value={maxSize} onChange={onMaxSize} />
        <span className="field-hint">Smaller is faster and gives simpler sheets. Full keeps every pixel.</span>
      </div>
    </>
  )
}
