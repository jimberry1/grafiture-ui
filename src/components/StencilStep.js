import { NumberField, Toggle } from "./Controls"
import { ChevronRight, Sparkle } from "./Icons"
import InfoTip from "./InfoTip"

// Four ways of making sheets, laid out by the two choices behind them: can colours
// overlap, and are bridges allowed. Each maps to a server strategy (and, for paint
// order, how it handles islands).
export const CHOICES = [
  {
    id: "paint-order",
    overlap: true,
    bridges: false,
    name: "Paint order",
    summary: "Base coat, then a sheet per colour",
    strategy: "paint-order",
    islands: "touch-up",
    info: {
      how: "Colours are ranked from the outside of the image inwards. The outermost is a base coat sprayed over the whole canvas, with no sheet. Every other colour gets one sheet that opens its colour plus everything sprayed after it, so later colours land on top. Specks of an earlier colour trapped inside a later one are sprayed over, then put back by a few touch-up sheets at the end.",
      best: "Most images, especially with a clear background colour, fine detail, or sheets you'll line up by hand.",
      tradeoffs: "No bridges, so every sheet is sturdy, and overlaps hide small misalignments. Touch-ups add a few sheets, and it relies on paint that covers what's underneath.",
    },
  },
  {
    id: "paint-order-bridges",
    overlap: true,
    bridges: true,
    name: "Paint order + bridges",
    summary: "Fewer sheets, islands bridged",
    strategy: "paint-order",
    islands: "bridge",
    info: {
      how: "Paint order as usual, but specks trapped inside later colours are held on with thin bridges instead of being touched up. Bridges prefer to cross areas a later sheet repaints anyway.",
      best: "Paint order with fewer sheets, when you don't mind cutting bridges.",
      tradeoffs: "Bridges are fiddly on tiny detail. Cover-up sheets re-spray what they hide, or leave them off and keep the bridge lines as part of the look.",
    },
  },
  {
    id: "layers",
    overlap: false,
    bridges: false,
    name: "Layers",
    summary: "A sheet per nesting level",
    strategy: "layers",
    info: {
      how: "One sheet per colour per nesting level: white outside a black ring and white inside it become two white sheets. Each sheet opens its shapes plus everything inside them, sprayed largest first, so nothing needs bridging. Colours side by side meet edge to edge.",
      best: "Nested designs, like rings within rings or outlines inside outlines, and paint that doesn't cover well.",
      tradeoffs: "No bridges and little overspray, but side-by-side colours butt together, so misaligned sheets show as gaps. The background needs its own sheet.",
    },
  },
  {
    id: "stints",
    overlap: false,
    bridges: true,
    name: "Stints",
    summary: "One sheet per colour, bridged",
    strategy: "stints",
    info: {
      how: "One sheet per colour, each opening only that colour, so every area is sprayed once. Pieces that would fall out are held on by thin bridges (stints), and cover-up sheets, at most one per colour, re-spray the strips the bridges hid.",
      best: "Big flat shapes with few enclosed bits, translucent paint, or the classic bridged-stencil look (turn cover-ups off).",
      tradeoffs: "The most bridges of all four: avoid it for busy images like foam, dots or edges. Colours meet edge to edge, so alignment has to be accurate.",
    },
  },
]

export function choiceFor(strategy, options) {
  if (strategy === "paint-order") return CHOICES.find((c) => c.islands === (options.islands === "bridge" ? "bridge" : "touch-up"))
  return CHOICES.find((c) => c.id === strategy) || CHOICES[0]
}

function estimateText({ sheets, "base-coat": baseCoat, bridges }) {
  return `≈ ${sheets} sheet${sheets === 1 ? "" : "s"}${baseCoat ? " + base" : ""} · ${bridges === 0 ? "no bridges" : `${bridges} bridges`}`
}

function ChoiceInfo({ choice }) {
  return (
    <InfoTip label={`About ${choice.name}`}>
      <h4>{choice.name}</h4>
      <dl>
        <div><dt>How it works</dt><dd>{choice.info.how}</dd></div>
        <div><dt>Best for</dt><dd>{choice.info.best}</dd></div>
        <div><dt>Trade-offs</dt><dd>{choice.info.tradeoffs}</dd></div>
      </dl>
    </InfoTip>
  )
}

function Cell({ choice, selected, recommended, estimate, onChoose }) {
  return (
    <label className={`choice-cell${selected ? " is-selected" : ""}`}>
      <input type="radio" name="sheet-choice" className="visually-hidden" checked={selected} onChange={() => onChoose(choice)} />
      <span className="choice-name">{choice.name}</span>
      <ChoiceInfo choice={choice} />
      <span className="choice-summary">{choice.summary}</span>
      {estimate && <span className="choice-estimate">{estimateText(estimate)}</span>}
      {recommended && <span className="badge badge-ok choice-badge">Recommended</span>}
    </label>
  )
}

export default function StencilStep({ strategy, options, recommendation, onStrategy, onOptions }) {
  const current = choiceFor(strategy, options)
  const estimates = Object.fromEntries((recommendation?.estimates || []).map((e) => [e.strategy, e]))
  const set = (key) => (value) => onOptions({ ...options, [key]: value })
  const choose = (choice) => {
    onStrategy(choice.strategy)
    const { islands, ...rest } = options
    onOptions(choice.islands ? { ...rest, islands: choice.islands } : rest)
  }
  const at = (overlap, bridges) => CHOICES.find((c) => c.overlap === overlap && c.bridges === bridges)
  const recommended = CHOICES.find((c) => c.id === recommendation?.recommended)
  const usesBridges = current.bridges || (strategy === "layers" && options["max-sheets-per-colour"] != null)
  const mm = options["print-width-mm"] != null
  // switching units clears the sizes set in the other unit, so only one is ever sent
  const setPrintWidth = (value) =>
    onOptions(value == null
      ? { ...options, "print-width-mm": null, "stint-width-mm": null, "margin-mm": null }
      : { ...options, "print-width-mm": value, "stint-width": null, margin: null, "stint-width-mm": options["stint-width-mm"] ?? 3 })

  return (
    <>
      {recommendation && recommended && (
        <div className="recommendation" role="status">
          <Sparkle size={16} />
          <div>
            <strong>Recommended: {recommended.name}</strong>
            <span>{recommendation.reason}</span>
          </div>
          {current.id !== recommended.id && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => choose(recommended)}>Use it</button>
          )}
        </div>
      )}

      <div className="choice-grid" role="radiogroup" aria-label="How to make the sheets">
        <span className="choice-axis">No bridges</span>
        <span className="choice-axis">Bridges</span>
        {[
          { overlap: true, label: "Colours overlap", note: "forgiving to line up" },
          { overlap: false, label: "Edge to edge", note: "each area sprayed once" },
        ].map(({ overlap, label, note }) => [
          <span key={label} className="choice-row">{label} <small>· {note}</small></span>,
          ...[false, true].map((bridges) => {
            const c = at(overlap, bridges)
            return <Cell key={c.id} choice={c} selected={current.id === c.id} recommended={recommended?.id === c.id} estimate={estimates[c.id]} onChoose={choose} />
          }),
        ])}
      </div>

      {usesBridges && (
        <div className="choice-options">
          <Toggle label="Cover-up sheets for bridges" checked={options["cover-ups"] ?? true} onChange={set("cover-ups")} />
          <span className="field-hint">At most one extra sheet per colour, re-spraying the strips the bridges hid. Off keeps the bridge lines as part of the look.</span>
        </div>
      )}

      <details className="advanced">
        <summary><ChevronRight size={16} /> Advanced</summary>
        <div className="advanced-body">
          {strategy === "layers" && (
            <NumberField label="Sheet budget" hint="Max sheets per colour; extra depths get bridges" min={1} max={100}
              value={options["max-sheets-per-colour"]} placeholder="none" onChange={set("max-sheets-per-colour")} />
          )}
          <Toggle label="Export for cutters (SVG + DXF)" checked={options.vectors ?? false} onChange={set("vectors")} />
          <span className="field-hint" style={{ marginTop: "calc(-1 * var(--space-2))" }}>
            Traced cut lines with registration holes, at print size when a print width is set.
          </span>
          <NumberField label="Print width" hint="Finished width in mm; sizes below switch to mm" min={10} max={100000}
            value={options["print-width-mm"]} placeholder="none" onChange={setPrintWidth} />
          {usesBridges && (
            <>
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
