import { useEffect, useState } from "react"
import { jobFileUrl, jobZipUrl } from "../api"
import { lightness } from "../colours"
import { Segmented } from "./Controls"
import { Alert, Check, Close, Download, Spray } from "./Icons"

const KIND_LABEL = { layer: "Layer", final: "Final pass", sheet: "Sheet", base: "Base coat", "touch-up": "Touch-up", "cover-up": "Cover-up" }

function Lightbox({ jobId, sheet, onClose }) {
  const [view, setView] = useState("view")
  useEffect(() => {
    const key = (e) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [onClose])

  const file = view === "view" ? sheet["view-file"] : sheet.file
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={sheet.name} onClick={onClose}>
      <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
        <strong>{sheet.order}. {sheet.name}</strong>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <Segmented label="Sheet view" value={view} onChange={setView}
            options={[{ value: "view", label: "Cut view" }, { value: "mask", label: "Mask" }]} />
          <a className="btn btn-secondary btn-sm" href={jobFileUrl(jobId, file)} download={file}>
            <Download size={14} /> PNG
          </a>
          {sheet["svg-file"] && (
            <a className="btn btn-secondary btn-sm" href={jobFileUrl(jobId, sheet["svg-file"])} download={sheet["svg-file"]}>SVG</a>
          )}
          {sheet["dxf-file"] && (
            <a className="btn btn-secondary btn-sm" href={jobFileUrl(jobId, sheet["dxf-file"])} download={sheet["dxf-file"]}>DXF</a>
          )}
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Close /></button>
        </div>
      </div>
      <div className="lightbox-view">
        <img src={jobFileUrl(jobId, file)} alt={`${sheet.name} sheet`} onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  )
}

function SheetCard({ jobId, sheet, rgb, onOpen }) {
  const colour = rgb ? `rgb(${rgb.join(",")})` : "#888"
  return (
    <button type="button" className="sheet-card" onClick={sheet.file ? onOpen : undefined} style={sheet.file ? undefined : { cursor: "default" }}>
      <span className="sheet-thumb" style={sheet.file ? undefined : { background: colour }}>
        {sheet.file ? (
          <img src={jobFileUrl(jobId, sheet["view-file"])} alt="" loading="lazy" />
        ) : (
          <span className="base-coat" style={{ color: rgb && lightness(rgb) > 0.6 ? "#111" : "#fff", textShadow: "none" }}>
            <Spray size={22} />
            Spray the whole canvas
          </span>
        )}
        <span className="sheet-order">{sheet.order}</span>
      </span>
      <span className="sheet-meta">
        <span className="dot" style={{ background: colour }} />
        <strong>{sheet.name}</strong>
        <span className="badge">{KIND_LABEL[sheet.kind] || sheet.kind}</span>
      </span>
      {sheet.stints && (sheet.stints.bridges > 0 || sheet.stints["removed-islands"] > 0) && (
        <span className="field-hint" style={{ padding: "0 var(--space-1) var(--space-1)" }}>
          {sheet.stints.bridges} bridges · {sheet.stints["removed-islands"]} specks cut away
        </span>
      )}
    </button>
  )
}

export default function SheetsView({ job }) {
  const [open, setOpen] = useState(null)

  if (job.status === "queued" || job.status === "running" || job.status === "submitting") {
    return (
      <div className="job-progress" role="status">
        <span className="spinner" />
        <strong>{job.status === "running" ? "Cutting your sheets…" : "Queued…"}</strong>
        <span>Finding regions, ordering colours and bridging islands.</span>
      </div>
    )
  }

  if (job.status === "failed") {
    return <div className="alert" role="alert"><Alert size={18} /> {job.error || "Stencil creation failed."}</div>
  }

  const { manifest, id } = job
  const { stats } = manifest
  const totalMs = Object.values(stats["timings-ms"] || {}).reduce((a, b) => a + b, 0)
  const sprayed = manifest.sheets.length

  return (
    <div className="sheets">
      <div className="sheets-head">
        <div>
          <h2>{stats["sheet-count"]} {stats["sheet-count"] === 1 ? "sheet" : "sheets"} to cut{sprayed > stats["sheet-count"] ? " + a base coat" : ""}</h2>
          <div className="stat-row">
            {stats["floating-pieces"] === 0 && <span className="badge badge-ok"><Check size={12} /> Every piece attached</span>}
            <span className="badge">{stats.strategy}</span>
            <span className={`badge${stats.bridges === 0 ? " badge-ok" : ""}`}>{stats.bridges === 0 ? "No bridges" : `${stats.bridges} bridges`}</span>
            {stats["touch-up-sheets"] > 0 && <span className="badge">{stats["touch-up-sheets"]} touch-ups</span>}
            {stats["cover-up-sheets"] > 0 && <span className="badge">{stats["cover-up-sheets"]} cover-ups</span>}
            {stats.style !== "none" && <span className="badge">{stats.style}</span>}
            <span className="badge">{stats.regions.toLocaleString()} regions</span>
            <span className="badge">{(totalMs / 1000).toFixed(1)} s</span>
          </div>
        </div>
        <a className="btn btn-primary" href={jobZipUrl(id)} download>
          <Download size={16} /> Download all
        </a>
      </div>
      <div className="sheet-grid">
        {manifest.sheets.map((sheet) => (
          <SheetCard key={sheet.order} jobId={id} sheet={sheet} rgb={manifest.palette[sheet.colour]} onOpen={() => setOpen(sheet)} />
        ))}
      </div>
      <p className="field-hint">Spray in the numbered order. Sheets are framed so every piece stays attached; the frame is uncut card.</p>
      {open && <Lightbox jobId={id} sheet={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
