import { NumberField, Segmented, Toggle } from "./Controls"
import { ChevronRight, Sparkle } from "./Icons"
import InfoTip from "./InfoTip"

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

// What each strategy does, shown on hover. Figures are from the Great Wave example.
const INFO = {
  "paint-order": {
    how: "Colours are ranked from the outside of the image inwards. The outermost is a base coat sprayed over the whole canvas, with no sheet. Every other colour gets one sheet that cuts its colour plus everything sprayed after it, so later colours land on top. Specks of an earlier colour trapped inside a later one are sprayed over, then put back by touch-up sheets at the end.",
    best: "Images with a clear background colour and a fairly flat palette, and fine detail like foam, dots, text or contour lines.",
    tradeoffs: "No bridges, so every sheet is sturdy. Expect a few touch-up sheets on top of one sheet per colour. Relies on paint that covers what's underneath.",
    stat: "Great Wave: base coat + 4 sheets + 6 touch-ups, 0 bridges.",
  },
  stints: {
    how: "One sheet per colour, each cutting only that colour, so every area is sprayed once. Pieces that would fall out are held on by thin bridges (stints). Cover-up sheets, at most one per colour, then re-spray the strips the bridges hid.",
    best: "Big flat shapes with few enclosed bits, the fewest sheets to line up, or translucent paint that shouldn't overlap. Turn cover-ups off to keep the bridge lines as part of the look.",
    tradeoffs: "Bridges are fiddly to cut on tiny detail and can tear, so avoid this for busy images like foam, dots or edges.",
    stat: "Great Wave: 5 sheets + 5 cover-ups, 757 bridges.",
  },
  layers: {
    how: "One sheet per colour per nesting level: white outside a black ring and white inside it become two white sheets. Each sheet cuts its regions plus everything inside them, and the largest sheets are sprayed first. No base coat.",
    best: "Strongly nested designs, like rings within rings or outlines inside outlines, without a dominant background colour.",
    tradeoffs: "No bridges. The sheet count grows with how deeply shapes nest rather than with the number of colours, and the background colour's first sheet can open nearly the whole canvas.",
    stat: "Great Wave: 6 sheets + 5 touch-ups, 0 bridges.",
  },
}

function StrategyInfo({ strategy }) {
  const info = INFO[strategy.id]
  return (
    <InfoTip label={`About ${strategy.name}`}>
      <h4>{strategy.name}</h4>
      <dl>
        <div><dt>How it works</dt><dd>{info.how}</dd></div>
        <div><dt>Best for</dt><dd>{info.best}</dd></div>
        <div><dt>Trade-offs</dt><dd>{info.tradeoffs}</dd></div>
      </dl>
      <p className="tip-stat">{info.stat}</p>
    </InfoTip>
  )
}

function estimateText({ sheets, "base-coat": baseCoat, bridges }) {
  return `≈ ${sheets} sheet${sheets === 1 ? "" : "s"}${baseCoat ? " + base coat" : ""} · ${bridges === 0 ? "no bridges" : `${bridges} bridges`}`
}

function Recommendation({ recommendation, strategy, onStrategy }) {
  const pick = STRATEGIES.find((s) => s.id === recommendation.recommended)
  return (
    <div className="recommendation" role="status">
      <Sparkle size={16} />
      <div>
        <strong>Recommended: {pick?.name}</strong>
        <span>{recommendation.reason}</span>
      </div>
      {strategy !== recommendation.recommended && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onStrategy(recommendation.recommended)}>Use it</button>
      )}
    </div>
  )
}

export default function StencilStep({ strategy, options, recommendation, onStrategy, onOptions }) {
  const estimates = Object.fromEntries((recommendation?.estimates || []).map((e) => [e.strategy, e]))
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
      {recommendation && <Recommendation recommendation={recommendation} strategy={strategy} onStrategy={onStrategy} />}

      <div className="strategy-list" role="radiogroup" aria-label="Strategy">
        {STRATEGIES.map((s) => (
          <label key={s.id} className={`strategy-card${strategy === s.id ? " is-selected" : ""}`}>
            <input type="radio" name="strategy" value={s.id} checked={strategy === s.id} onChange={() => onStrategy(s.id)} />
            <strong>
              <span className="strategy-name">{s.name}</span>
              <span className={`badge${strategy === s.id ? " badge-accent" : ""}`}>{s.badge}</span>
              {recommendation?.recommended === s.id && <span className="badge badge-ok">Recommended</span>}
              <StrategyInfo strategy={s} />
            </strong>
            <p>{s.blurb}</p>
            {estimates[s.id] && <p className="estimate">{estimateText(estimates[s.id])}</p>}
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
          <Toggle label="Export for cutters (SVG + DXF)" checked={options.vectors ?? false} onChange={set("vectors")} />
          <span className="field-hint" style={{ marginTop: "calc(-1 * var(--space-2))" }}>
            Traced cut lines with registration holes, at print size when a print width is set.
          </span>
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
