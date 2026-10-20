import { Slider, Toggle } from "./Controls"
import { StyleArt } from "./Icons"

export const STYLES = [
  { id: "none", name: "Original", blurb: "The image as it is" },
  { id: "edges", name: "Edges", blurb: "Glowing outlines" },
  { id: "contour-lines", name: "Contour lines", blurb: "Lines that rise over light" },
  { id: "pointillism", name: "Pointillism", blurb: "Dots of colour" },
  { id: "halftone", name: "Halftone", blurb: "Pop-art print dots" },
  { id: "crosshatch", name: "Crosshatch", blurb: "Engraved hatching" },
  { id: "stained-glass", name: "Stained glass", blurb: "Mosaic with lead lines" },
  { id: "low-poly", name: "Low poly", blurb: "Flat triangle facets" },
  { id: "poster", name: "Poster", blurb: "Flat colour, bold outlines" },
]

// Defaults mirror the server's, and keys match its style-options.
export const DEFAULT_STYLE_OPTIONS = {
  edges: { "edge-strength": 1.5, smoothing: 1, "invert?": false },
  "contour-lines": { "line-spacing": 12, amplitude: 14, "line-width": 4, "weight-by-tone?": true },
  pointillism: { "dot-size": 10 },
  halftone: { "cell-size": 10, angle: 45, "colour?": false },
  crosshatch: { "line-spacing": 8, "line-width": 1.6 },
  "stained-glass": { "cell-size": 24, "lead-width": 3 },
  "low-poly": { "cell-size": 32 },
  poster: { smoothing: 4, outline: 0.5 },
}

function Options({ style, options, onChange }) {
  const set = (key) => (value) => onChange({ ...options, [key]: value })
  switch (style) {
    case "edges":
      return (
        <>
          <Slider label="Strength" min={0.5} max={4} step={0.1} value={options["edge-strength"]}
            format={(v) => `${v.toFixed(1)}×`} hint="Higher shows fainter edges." onChange={set("edge-strength")} />
          <Slider label="Smoothing" min={0} max={6} value={options.smoothing} format={(v) => `${v}px`}
            hint="Blurs texture away before finding edges." onChange={set("smoothing")} />
          <div className="field">
            <Toggle label="Dark lines on light" checked={options["invert?"]} onChange={set("invert?")} />
          </div>
        </>
      )
    case "contour-lines":
      return (
        <>
          <Slider label="Line spacing" min={4} max={40} value={options["line-spacing"]} format={(v) => `${v}px`}
            onChange={(v) => onChange({ ...options, "line-spacing": v, amplitude: Math.round(v * 1.2), "line-width": Math.max(1, Math.round(v * 0.3)) })} />
          <Slider label="Height" min={0} max={80} value={options.amplitude} format={(v) => `${v}px`}
            hint="How far lines rise over light areas." onChange={set("amplitude")} />
          <Slider label="Line weight" min={1} max={20} value={options["line-width"]} format={(v) => `${v}px`} onChange={set("line-width")} />
          <div className="field">
            <Toggle label="Heavier lines over dark areas" checked={options["weight-by-tone?"]} onChange={set("weight-by-tone?")} />
          </div>
        </>
      )
    case "pointillism":
      return (
        <Slider label="Dot size" min={4} max={40} value={options["dot-size"]} format={(v) => `${v}px`}
          hint="Larger dots give fewer, simpler regions." onChange={set("dot-size")} />
      )
    case "halftone":
      return (
        <>
          <Slider label="Dot spacing" min={4} max={30} value={options["cell-size"]} format={(v) => `${v}px`} onChange={set("cell-size")} />
          <Slider label="Screen angle" min={0} max={90} value={options.angle} format={(v) => `${v}°`} onChange={set("angle")} />
          <div className="field"><Toggle label="Coloured dots" checked={options["colour?"]} onChange={set("colour?")} /></div>
        </>
      )
    case "crosshatch":
      return (
        <>
          <Slider label="Line spacing" min={4} max={24} value={options["line-spacing"]} format={(v) => `${v}px`} onChange={set("line-spacing")} />
          <Slider label="Line weight" min={1} max={6} step={0.2} value={options["line-width"]} format={(v) => `${v.toFixed(1)}px`} onChange={set("line-width")} />
        </>
      )
    case "stained-glass":
      return (
        <>
          <Slider label="Cell size" min={8} max={80} value={options["cell-size"]} format={(v) => `${v}px`} onChange={set("cell-size")} />
          <Slider label="Lead width" min={1} max={8} value={options["lead-width"]} format={(v) => `${v}px`} onChange={set("lead-width")} />
        </>
      )
    case "low-poly":
      return <Slider label="Facet size" min={8} max={120} value={options["cell-size"]} format={(v) => `${v}px`} onChange={set("cell-size")} />
    case "poster":
      return (
        <>
          <Slider label="Flatness" min={0} max={10} value={options.smoothing} format={(v) => `${v} passes`} onChange={set("smoothing")} />
          <Slider label="Outline" min={0} max={1} step={0.05} value={options.outline} format={(v) => `${Math.round(v * 100)}%`} onChange={set("outline")} />
        </>
      )
    default:
      return null
  }
}

export default function StyleStep({ style, options, onStyle, onOptions }) {
  return (
    <>
      <div className="style-grid">
        {STYLES.map((s) => (
          <button key={s.id} type="button" className="style-card" aria-pressed={style === s.id} onClick={() => onStyle(s.id)}>
            <span className="style-thumb"><StyleArt style={s.id} /></span>
            <strong>{s.name}</strong>
            <span>{s.blurb}</span>
          </button>
        ))}
      </div>
      {style !== "none" && (
        <div className="style-options">
          <Options style={style} options={options} onChange={onOptions} />
        </div>
      )}
    </>
  )
}
