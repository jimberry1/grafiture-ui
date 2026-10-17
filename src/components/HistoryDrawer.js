import { toHex } from "../colours"
import Drawer from "./Drawer"
import { Clock, Trash } from "./Icons"

const STYLE_NAMES = { none: "Original", edges: "Edges", "contour-lines": "Contour lines", pointillism: "Pointillism" }
const STRATEGY_NAMES = { "paint-order": "Paint order", stints: "Stints", layers: "Layers" }

function when(ms) {
  const minutes = Math.round((Date.now() - ms) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

// Previous stencils, newest first. Opening one restores its image and settings.
export default function HistoryDrawer({ entries, onOpen, onDelete, onClear, onClose }) {
  return (
    <Drawer title="History" subtitle={`${entries.length} stencil${entries.length === 1 ? "" : "s"}, saved in this browser`} onClose={onClose}
      footer={entries.length > 0 && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>Clear history</button>
      )}>
      {entries.length === 0 ? (
        <div className="empty-hint"><Clock size={18} /> Stencils you create appear here, so you can come back to them.</div>
      ) : (
        <div className="history-list">
          {entries.map((e) => (
            <article key={e.id} className="history-card">
              <button type="button" className="history-open" onClick={() => onOpen(e)} aria-label={`Open ${e.fileName}`}>
                <span className="history-thumb">{e.thumb ? <img src={e.thumb} alt="" /> : null}</span>
                <span className="history-meta">
                  <strong>{e.fileName}</strong>
                  <span>{STYLE_NAMES[e.style] || e.style} · {STRATEGY_NAMES[e.strategy] || e.strategy} · {e.sheetCount} sheet{e.sheetCount === 1 ? "" : "s"}</span>
                  <span className="history-strip" aria-hidden="true">
                    {e.palette.map((c) => <i key={c.name} style={{ background: toHex(c.rgb) }} title={c.name} />)}
                  </span>
                  <span className="field-hint">{when(e.createdAt)}</span>
                </span>
              </button>
              <button type="button" className="icon-btn" aria-label={`Delete ${e.fileName}`} onClick={() => onDelete(e.id)}>
                <Trash size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </Drawer>
  )
}
