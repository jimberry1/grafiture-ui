import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { healthcheck, jobStatus, preview, recommend, submitJob } from "./api"
import { paletteEntry, suggestPalette, withId } from "./colours"
import { Step } from "./components/Controls"
import HistoryDrawer from "./components/HistoryDrawer"
import { Alert, Clock, Gear, Logo, Spray } from "./components/Icons"
import ImageStep from "./components/ImageStep"
import PaletteStep, { DETAIL_LEVELS } from "./components/PaletteStep"
import SheetsView from "./components/SheetsView"
import Stage from "./components/Stage"
import StencilStep, { STRATEGIES } from "./components/StencilStep"
import SettingsDrawer from "./components/SettingsDrawer"
import StyleStep, { DEFAULT_STYLE_OPTIONS, STYLES } from "./components/StyleStep"
import { clearHistory, deleteHistoryEntry, loadHistory, loadPaints, saveHistoryEntry, savePaints, thumbnail } from "./storage"
import useDebouncedEffect from "./useDebouncedEffect"

function useApiStatus() {
  const [up, setUp] = useState(null)
  useEffect(() => {
    let live = true
    const check = () => healthcheck().then((ok) => live && setUp(ok), () => live && setUp(false))
    check()
    const timer = setInterval(check, 10000)
    return () => { live = false; clearInterval(timer) }
  }, [])
  return up
}

// Keeps one object URL alive at a time, revoking the previous one.
function useObjectUrl() {
  const [url, setUrl] = useState(null)
  const current = useRef(null)
  const replace = useCallback((next) => {
    if (current.current && current.current !== next) URL.revokeObjectURL(current.current)
    current.current = next
    setUrl(next)
  }, [])
  return [url, replace]
}

export default function App() {
  const apiUp = useApiStatus()

  // step 1: image
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useObjectUrl()
  const [dims, setDims] = useState(null)
  const [maxSize, setMaxSize] = useState(1200)

  // step 2: style
  const [style, setStyle] = useState("none")
  const [styleOptions, setStyleOptions] = useState(DEFAULT_STYLE_OPTIONS)
  const [styledUrl, setStyledUrl] = useObjectUrl()

  // step 3: palette
  const [palette, setPalette] = useState([])
  const [detail, setDetail] = useState(2)
  const [previewUrl, setPreviewUrl] = useObjectUrl()
  const [regions, setRegions] = useState(null)
  const [suggesting, setSuggesting] = useState(false)

  // step 4: stencil
  const [strategy, setStrategy] = useState("paint-order")
  const [stencilOptions, setStencilOptions] = useState({})
  const [job, setJob] = useState(null)
  const [recommendation, setRecommendation] = useState(null)

  const [openStep, setOpenStep] = useState(1)
  const [tab, setTab] = useState("original")
  const [busy, setBusy] = useState({})
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  // header panels: saved paints and history, both kept in this browser
  const [drawer, setDrawer] = useState(null)
  const [paints, setPaints] = useState(loadPaints)
  const [history, setHistory] = useState([])
  useEffect(() => savePaints(paints), [paints])
  useEffect(() => { loadHistory().then(setHistory) }, [])
  const closeDrawer = useCallback(() => setDrawer(null), [])

  const minRegionSize = DETAIL_LEVELS[detail].minRegionSize
  const currentStyleOptions = styleOptions[style] || {}
  const baseOptions = useMemo(
    () => ({ file, palette, maxSize, style, styleOptions: currentStyleOptions, minRegionSize }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file, palette, maxSize, style, JSON.stringify(currentStyleOptions), minRegionSize]
  )

  const loadFile = (picked) => {
    setFile(picked)
    const url = URL.createObjectURL(picked)
    setFileUrl(url)
    const probe = new Image()
    probe.onload = () => setDims({ w: probe.naturalWidth, h: probe.naturalHeight })
    probe.src = url
    setDims(null)
    setJob(null)
    setNotice(null)
    return url
  }

  const onFile = (picked) => {
    loadFile(picked)
    setTab("original")
    setOpenStep(2)
  }

  const setLoading = (key, value) => setBusy((b) => ({ ...b, [key]: value }))

  // styled preview, whenever the image or style settings change
  useDebouncedEffect((signal) => {
    if (!file || style === "none") { setStyledUrl(null); return }
    setLoading("styled", true)
    preview(baseOptions, { view: "styled", signal })
      .then(({ url }) => { setStyledUrl(url); setError(null) })
      .catch((e) => e.name !== "AbortError" && setError(e.message))
      .finally(() => !signal.aborted && setLoading("styled", false))
  }, [file, maxSize, style, JSON.stringify(currentStyleOptions)], 300)

  // quantised preview, whenever anything that feeds it changes
  useDebouncedEffect((signal) => {
    if (!file || palette.length === 0) { setPreviewUrl(null); setRegions(null); return }
    setLoading("preview", true)
    preview(baseOptions, { view: "quantised", signal })
      .then(({ url, regions }) => { setPreviewUrl(url); setRegions(regions); setError(null) })
      .catch((e) => e.name !== "AbortError" && setError(e.message))
      .finally(() => !signal.aborted && setLoading("preview", false))
  }, [baseOptions], 400)

  // a strategy recommendation, fetched alongside the preview rather than after it
  useDebouncedEffect((signal) => {
    if (!file || palette.length === 0) { setRecommendation(null); return }
    recommend({ ...baseOptions, ...stencilOptions }, { signal })
      .then(setRecommendation)
      .catch((e) => e.name !== "AbortError" && setRecommendation(null))
  }, [baseOptions, JSON.stringify(stencilOptions)], 400)

  // follow the job until it finishes
  useEffect(() => {
    if (!job?.id || !["queued", "running"].includes(job.status)) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      jobStatus(job.id, { signal: controller.signal })
        .then((next) => setJob(next))
        .catch((e) => e.name !== "AbortError" && setJob({ ...job, status: "failed", error: e.message }))
    }, 500)
    return () => { clearTimeout(timer); controller.abort() }
  }, [job])

  const sourceUrl = style !== "none" && styledUrl ? styledUrl : fileUrl

  const addColour = (rgb) => {
    setPalette((p) => [...p, paletteEntry(rgb, p.map((c) => c.name), paints)])
    setOpenStep(3)
  }

  const suggest = async (count) => {
    if (!sourceUrl) return
    setSuggesting(true)
    try {
      const colours = await suggestPalette(sourceUrl, count)
      setPalette(colours.reduce((acc, rgb) => [...acc, paletteEntry(rgb, acc.map((c) => c.name), paints)], []))
      setTab("preview")
    } finally {
      setSuggesting(false)
    }
  }

  const createStencil = async () => {
    setError(null)
    setNotice(null)
    setJob({ status: "submitting" })
    setTab("sheets")
    try {
      setJob(await submitJob({ ...baseOptions, strategy, ...stencilOptions }))
    } catch (e) {
      setJob({ status: "failed", error: e.message })
    }
  }

  // remember each finished stencil, with everything needed to come back to it
  const saved = useRef(new Set())
  useEffect(() => {
    if (job?.status !== "done" || saved.current.has(job.id) || !file) return
    saved.current.add(job.id)
    thumbnail(fileUrl).then((thumb) =>
      saveHistoryEntry({
        id: job.id,
        createdAt: Date.now(),
        file,
        fileName: file.name,
        thumb,
        palette: palette.map(({ name, rgb }) => ({ name, rgb })),
        style,
        styleOptions: currentStyleOptions,
        maxSize,
        detail,
        strategy,
        stencilOptions,
        sheetCount: job.manifest.stats["sheet-count"],
      }).then(() => loadHistory().then(setHistory))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job])

  const restore = async (entry) => {
    setDrawer(null)
    loadFile(new File([entry.file], entry.fileName, { type: entry.file.type }))
    setMaxSize(entry.maxSize)
    setStyle(entry.style)
    setStyleOptions((all) => ({ ...all, [entry.style]: entry.styleOptions }))
    setPalette(entry.palette.map(withId))
    setDetail(entry.detail)
    setStrategy(entry.strategy)
    setStencilOptions(entry.stencilOptions || {})
    setOpenStep(4)
    saved.current.add(entry.id)
    try {
      const status = await jobStatus(entry.id)
      setJob(status)
      setTab("sheets")
    } catch {
      setTab("preview")
      setNotice("The server has cleared these sheets. Everything else is restored: press Create stencil to make them again, identical to before.")
    }
  }

  // jump to the new preview once the first colours arrive
  const hadPalette = useRef(false)
  useEffect(() => {
    if (palette.length && !hadPalette.current && tab !== "sheets") setTab("preview")
    hadPalette.current = palette.length > 0
  }, [palette.length, tab])

  const tabs = [
    { id: "original", label: "Original", disabled: !file },
    { id: "styled", label: "Styled", disabled: !file || style === "none" },
    { id: "preview", label: "Preview", disabled: !previewUrl, badge: palette.length || null },
    { id: "sheets", label: "Sheets", disabled: !job, badge: job?.manifest ? job.manifest.stats["sheet-count"] : null },
  ]

  const stageUrl = { original: fileUrl, styled: styledUrl, preview: previewUrl }[tab]
  const loadingLabel =
    (tab === "styled" && busy.styled && "Styling…") || (tab === "preview" && busy.preview && "Updating preview…") || null
  const canCreate = file && palette.length > 0 && apiUp !== false && !["submitting", "queued", "running"].includes(job?.status)

  const styleName = STYLES.find((s) => s.id === style)?.name
  const strategyName = STRATEGIES.find((s) => s.id === strategy)?.name

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Logo size={18} /></span>
          grafiture <small>stencil studio</small>
        </div>
        <div className="topbar-actions">
          <span className="status-pill" title="Connection to the grafiture API">
            <span className={`status-dot${apiUp === true ? " is-up" : apiUp === false ? " is-down" : ""}`} />
            {apiUp === false ? "API offline" : apiUp ? "Connected" : "Connecting…"}
          </span>
          <button type="button" className="header-btn" aria-expanded={drawer === "history"} onClick={() => setDrawer("history")}>
            <Clock size={16} /> <span className="label">History</span>
            {history.length > 0 && <span className="badge">{history.length}</span>}
          </button>
          <button type="button" className="header-btn" aria-expanded={drawer === "settings"} onClick={() => setDrawer("settings")}>
            <Gear size={16} /> <span className="label">Settings</span>
          </button>
        </div>
      </header>

      {drawer === "settings" && (
        <SettingsDrawer paints={paints} palette={palette} onPaints={setPaints} onClose={closeDrawer} />
      )}
      {drawer === "history" && (
        <HistoryDrawer entries={history} onOpen={restore} onClose={closeDrawer}
          onDelete={(id) => deleteHistoryEntry(id).then(() => loadHistory().then(setHistory))}
          onClear={() => clearHistory().then(() => setHistory([]))} />
      )}

      <main className="workspace">
        <aside className="panel" aria-label="Stencil settings">
          <Step number={1} title="Image" open={openStep === 1} done={!!file} onToggle={() => setOpenStep(openStep === 1 ? 0 : 1)}
            summary={file ? `${file.name}${dims ? ` · ${dims.w}×${dims.h}` : ""}` : "Upload the picture to stencil"}>
            <ImageStep file={file} fileUrl={fileUrl} dims={dims} maxSize={maxSize} onFile={onFile} onMaxSize={setMaxSize} />
          </Step>

          <Step number={2} title="Style" open={openStep === 2} done={!!file} locked={!file} onToggle={() => setOpenStep(openStep === 2 ? 0 : 2)}
            summary={styleName}>
            <StyleStep style={style} options={currentStyleOptions}
              onStyle={(s) => { setStyle(s); setTab(s === "none" ? "original" : "styled") }}
              onOptions={(o) => setStyleOptions((all) => ({ ...all, [style]: o }))} />
          </Step>

          <Step number={3} title="Colours" open={openStep === 3} done={palette.length > 0} locked={!file} onToggle={() => setOpenStep(openStep === 3 ? 0 : 3)}
            summary={palette.length ? `${palette.length} colours · ${DETAIL_LEVELS[detail].label.toLowerCase()} detail` : "Pick the spray colours"}>
            <PaletteStep palette={palette} paints={paints} regions={regions} suggesting={suggesting} detail={detail}
              onSuggest={suggest} onChange={setPalette} onDetail={setDetail} onManagePaints={() => setDrawer("settings")} />
          </Step>

          <Step number={4} title="Stencil" open={openStep === 4} done={!!job?.manifest} locked={!file || palette.length === 0}
            onToggle={() => setOpenStep(openStep === 4 ? 0 : 4)} summary={strategyName}>
            <StencilStep strategy={strategy} options={stencilOptions} recommendation={recommendation}
              onStrategy={setStrategy} onOptions={setStencilOptions} />
          </Step>

          {error && <div className="alert" role="alert" style={{ marginTop: "var(--space-3)" }}><Alert size={18} /> {error}</div>}
          {notice && <div className="notice" role="status" style={{ marginTop: "var(--space-3)" }}><Clock size={18} /> {notice}</div>}

          <div className="panel-footer">
            <button type="button" className="btn btn-primary btn-lg btn-block" disabled={!canCreate} onClick={createStencil}>
              {["submitting", "queued", "running"].includes(job?.status) ? <span className="spinner" /> : <Spray size={18} />}
              {["submitting", "queued", "running"].includes(job?.status) ? "Creating stencil…" : "Create stencil"}
            </button>
            {!canCreate && !job && (
              <p className="field-hint" style={{ textAlign: "center", margin: "var(--space-2) 0 0" }}>
                {apiUp === false ? "Start the API with lein server" : !file ? "Add an image to begin" : "Pick at least one colour"}
              </p>
            )}
          </div>
        </aside>

        <Stage
          tabs={tabs}
          tab={tab}
          onTab={setTab}
          loading={loadingLabel}
          hint={tab === "sheets" ? "Click a sheet to see it full size" : file && tab !== "preview" ? <Stage.PickHint /> : tab === "preview" ? "Every pixel mapped to your palette, specks merged away" : "grafiture runs locally: images go to your own API only"}
        >
          {!file ? (
            <Stage.Empty />
          ) : tab === "sheets" && job ? (
            <SheetsView job={job} />
          ) : stageUrl ? (
            <Stage.Image url={stageUrl} picking={tab !== "preview"} pixelated={tab === "preview"} onPick={addColour} />
          ) : error ? (
            <div className="alert" role="alert"><Alert size={18} /> {error}</div>
          ) : (
            <span className="spinner" />
          )}
        </Stage>
      </main>
    </div>
  )
}
