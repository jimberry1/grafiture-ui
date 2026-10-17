import { NumberField, Segmented, Toggle } from "./Controls"
import { ChevronRight } from "./Icons"

export const STRATEGIES = [
  {
    id: "paint-order",
    name: "Paint order",
    badge: "Base coat",
    blurb: "A base coat, then one sheet per colour from the outside in. Enclosed specks are sprayed over, then put right by touch-up sheets at the end.",
  },
  {
    id: "stints",
    name: "Stints",
    badge: "One per colour",
    blurb: "One sheet per colour. Islands are held on with thin bridges, then cover-up sheets re-spray the strips the bridges hid.",
  },
  {
    id: "layers",
    name: "Layers",
    badge: "No bridges",
    blurb: "A sheet per colour per nesting depth, sprayed largest first, so nothing needs bridging.",
  },
]

export default function StencilStep({ strategy, options, onStrategy, onOptions }) {
  const set = (key) => (value) => onOptions({ ...options, [key]: value })
  const usesStints =
    strategy === "stints" ||
    (strategy === "paint-order" && options.islands === "bridge") ||
    (strategy === "layers" && options["max-sheets-per-colour"] != null)
  const mm = options["print-width-mm"] != null
  // switching units clears the sizes set in the other unit, so only one is ever sent
  const setPrintWidth = (value) =>
    onOptions(value == null
      ? { ...options, "print-width-mm": null, "stint-width-mm": null, "margin-mm": null }
      : { ...options, "print-width-mm": value, "stint-width": null, margin: null, "stint-width-mm": options["stint-width-mm"] ?? 3 })

  return (
    <>
      <div className="strategy-list" role="radiogroup" aria-label="Strategy">
        {STRATEGIES.map((s) => (
          <label key={s.id} className={`strategy-card${strategy === s.id ? " is-selected" : ""}`}>
            <input type="radio" name="strategy" value={s.id} checked={strategy === s.id} onChange={() => onStrategy(s.id)} />
            <strong>
              {s.name} <span className={`badge${strategy === s.id ? " badge-accent" : ""}`}>{s.badge}</span>
            </strong>
            <p>{s.blurb}</p>
          </label>
        ))}
      </div>

      {strategy === "paint-order" && (
        <div className="field" style={{ marginTop: "var(--space-4)" }}>
          <span className="field-head"><span className="field-label">Enclosed islands</span></span>
          <Segmented label="Enclosed islands" value={options.islands ?? "touch-up"} onChange={set("islands")}
            options={[{ value: "touch-up", label: "Touch-up sheets" }, { value: "bridge", label: "Bridges" }]} />
          <span className="field-hint">
            {(options.islands ?? "touch-up") === "touch-up"
              ? "No bridges anywhere: a few extra sheets re-spray what was covered."
              : "Islands are held on with thin bridges; cover-up sheets re-spray what they hid."}
          </span>
        </div>
      )}

      <details className="advanced">
        <summary><ChevronRight size={16} /> Advanced</summary>
        <div className="advanced-body">
          {strategy === "layers" && (
            <NumberField label="Sheet budget" hint="Max sheets per colour" min={1} max={100}
              value={options["max-sheets-per-colour"]} placeholder="none" onChange={set("max-sheets-per-colour")} />
          )}
          <NumberField label="Print width" hint="Finished width in mm; sizes below switch to mm" min={10} max={100000}
            value={options["print-width-mm"]} placeholder="none" onChange={setPrintWidth} />
          {usesStints && (
            <>
              <Toggle label="Cover-up sheets for bridges" checked={options["cover-ups"] ?? true} onChange={set("cover-ups")} />
              <span className="field-hint" style={{ marginTop: "calc(-1 * var(--space-2))" }}>
                One extra sheet per colour at most, re-spraying the strips the bridges hid.
              </span>
              {mm ? (
                <NumberField label="Bridge width" hint="Millimetres at print size" min={0.1} max={100}
                  value={options["stint-width-mm"]} onChange={set("stint-width-mm")} />
              ) : (
                <NumberField label="Bridge width" hint="Pixels; auto ≈ 0.4% of the image" min={1} max={200}
                  value={options["stint-width"]} onChange={set("stint-width")} />
              )}
              <NumberField label="Smallest bridged island" hint="Pixels; smaller islands are cut away" min={0} max={100000}
                value={options["minimum-pixels-for-stint"]} placeholder="0" onChange={set("minimum-pixels-for-stint")} />
            </>
          )}
          {mm ? (
            <NumberField label="Frame" hint="Uncut margin, mm" min={0} max={1000} value={options["margin-mm"]} onChange={set("margin-mm")} />
          ) : (
            <NumberField label="Frame" hint="Uncut margin, pixels" min={0} max={1000} value={options.margin} onChange={set("margin")} />
          )}
        </div>
      </details>
    </>
  )
}
