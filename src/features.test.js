import { fireEvent, render, screen, within } from "@testing-library/react"
import App from "./App"
import { nameFor } from "./colours"
import { loadPaints, savePaints } from "./storage"

beforeEach(() => {
  localStorage.clear()
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))
})

test("colours take the name of a matching saved paint", () => {
  const paints = [{ name: "Montana Shock Blue", rgb: [28, 48, 96] }]
  expect(nameFor([28, 48, 96], [], paints)).toBe("montana-shock-blue")
  expect(nameFor([30, 50, 98], [], paints)).toBe("montana-shock-blue")
  expect(nameFor([30, 50, 98], ["montana-shock-blue"], paints)).toBe("montana-shock-blue-2")
})

test("colours without a matching paint get the nearest common name", () => {
  expect(nameFor([250, 245, 245], [], [{ name: "Blue", rgb: [0, 0, 255] }])).toBe("white")
})

test("paints round-trip through local storage", () => {
  savePaints([{ id: 1, name: "Ink", rgb: [10, 10, 10] }])
  expect(loadPaints()).toEqual([{ id: 1, name: "Ink", rgb: [10, 10, 10] }])
})

test("broken stored paints are ignored", () => {
  localStorage.setItem("grafiture.paints", "{not json")
  expect(loadPaints()).toEqual([])
})

test("paints added in Settings are saved", () => {
  render(<App />)
  fireEvent.click(screen.getByRole("button", { name: /Settings/i }))
  const dialog = screen.getByRole("dialog", { name: "Settings" })
  fireEvent.change(within(dialog).getByLabelText("Paint name"), { target: { value: "Shock Blue" } })
  fireEvent.change(within(dialog).getByLabelText("RGB values"), { target: { value: "28, 48, 96" } })
  fireEvent.click(within(dialog).getByRole("button", { name: /Add/i }))
  expect(within(dialog).getByDisplayValue("Shock Blue")).toBeInTheDocument()
  expect(loadPaints()).toEqual([expect.objectContaining({ name: "Shock Blue", rgb: [28, 48, 96] })])
})

test("history opens with an empty state", () => {
  render(<App />)
  fireEvent.click(screen.getByRole("button", { name: /History/i }))
  expect(screen.getByText(/Stencils you create appear here/i)).toBeInTheDocument()
})

test("each way of making sheets explains itself on hover", async () => {
  const { default: StencilStep } = await import("./components/StencilStep")
  render(<StencilStep strategy="paint-order" options={{}} onStrategy={() => {}} onOptions={() => {}} />)
  for (const name of ["Paint order", "Paint order + bridges", "Layers", "Stints"]) {
    const button = screen.getByRole("button", { name: `About ${name}` })
    fireEvent.mouseEnter(button)
    const tip = screen.getByRole("tooltip")
    expect(within(tip).getByText("How it works")).toBeInTheDocument()
    fireEvent.mouseLeave(button)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  }
})

test("tapping an info button does not change the choice", async () => {
  const { default: StencilStep } = await import("./components/StencilStep")
  const onStrategy = jest.fn()
  render(<StencilStep strategy="paint-order" options={{}} onStrategy={onStrategy} onOptions={() => {}} />)
  fireEvent.click(screen.getByRole("button", { name: "About Layers" }))
  expect(onStrategy).not.toHaveBeenCalled()
  expect(screen.getByRole("tooltip")).toBeInTheDocument()
})

test("the grid maps each cell to a strategy and island handling", async () => {
  const { default: StencilStep } = await import("./components/StencilStep")
  const onStrategy = jest.fn()
  const onOptions = jest.fn()
  render(<StencilStep strategy="layers" options={{ islands: "touch-up", margin: 10 }} onStrategy={onStrategy} onOptions={onOptions} />)
  fireEvent.click(screen.getByText("Paint order + bridges"))
  expect(onStrategy).toHaveBeenLastCalledWith("paint-order")
  expect(onOptions).toHaveBeenLastCalledWith({ islands: "bridge", margin: 10 })
  fireEvent.click(screen.getByText("Stints"))
  expect(onStrategy).toHaveBeenLastCalledWith("stints")
  expect(onOptions).toHaveBeenLastCalledWith({ margin: 10 })
})

test("bridge options only show for the bridged choices", async () => {
  const { default: StencilStep } = await import("./components/StencilStep")
  const { rerender } = render(<StencilStep strategy="paint-order" options={{}} onStrategy={() => {}} onOptions={() => {}} />)
  expect(screen.queryByText("Cover-up sheets for bridges")).not.toBeInTheDocument()
  rerender(<StencilStep strategy="paint-order" options={{ islands: "bridge" }} onStrategy={() => {}} onOptions={() => {}} />)
  expect(screen.getByText("Cover-up sheets for bridges")).toBeInTheDocument()
})

test("the recommended choice is marked, with estimates and a way to switch", async () => {
  const { default: StencilStep } = await import("./components/StencilStep")
  const onStrategy = jest.fn()
  const onOptions = jest.fn()
  const recommendation = {
    recommended: "paint-order",
    reason: "Paint order: 8 sheets + a base coat with no bridges; Stints would need 757 bridges.",
    estimates: [
      { strategy: "paint-order", sheets: 8, "base-coat": true, bridges: 0 },
      { strategy: "layers", sheets: 10, "base-coat": false, bridges: 0 },
      { strategy: "paint-order-bridges", sheets: 8, "base-coat": true, bridges: 319 },
      { strategy: "stints", sheets: 10, "base-coat": false, bridges: 757 },
    ],
  }
  render(<StencilStep strategy="stints" options={{}} recommendation={recommendation} onStrategy={onStrategy} onOptions={onOptions} />)
  expect(screen.getByText("Recommended: Paint order")).toBeInTheDocument()
  expect(screen.getByText("≈ 8 sheets + base · no bridges")).toBeInTheDocument()
  expect(screen.getByText("≈ 10 sheets · 757 bridges")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "Use it" }))
  expect(onStrategy).toHaveBeenCalledWith("paint-order")
  expect(onOptions).toHaveBeenCalledWith({ islands: "touch-up" })
})

test("recolouring helpers", async () => {
  const { shuffled, mergedGroups, invert, grey, sprayed } = await import("./colours")
  const palette = [
    { id: 1, name: "navy", rgb: [28, 48, 96] },
    { id: 2, name: "paper", rgb: [236, 226, 200] },
    { id: 3, name: "red", rgb: [200, 40, 40] },
  ]
  const s = shuffled(palette)
  s.forEach((c, i) => expect(sprayed(c)).not.toEqual(palette[i].rgb))
  expect(new Set(s.map((c) => sprayed(c).join()))).toEqual(new Set(palette.map((c) => c.rgb.join())))
  expect(invert([0, 100, 255])).toEqual([255, 155, 0])
  expect(grey([255, 255, 255])).toEqual([255, 255, 255])
  expect(mergedGroups([...palette, { id: 4, name: "ink", rgb: [10, 10, 10], mapTo: [28, 48, 96] }]).map((g) => g.map((c) => c.name)))
    .toEqual([["navy", "ink"]])
})

test("only recoloured colours are sent as the colour map", async () => {
  const { stencilForm } = await import("./api")
  const form = stencilForm({
    file: new Blob(["x"]),
    palette: [
      { name: "navy", rgb: [28, 48, 96], mapTo: [200, 0, 0] },
      { name: "paper", rgb: [236, 226, 200] },
      { name: "red", rgb: [200, 40, 40], mapTo: [200, 40, 40] },
    ],
  })
  expect(JSON.parse(form.get("colour-map"))).toEqual({ navy: [200, 0, 0] })
  expect(stencilForm({ file: new Blob(["x"]), palette: [{ name: "paper", rgb: [1, 2, 3] }] }).get("colour-map")).toBeNull()
})

test("a colour can be sprayed as another palette colour, then reset", async () => {
  const { default: PaletteStep } = await import("./components/PaletteStep")
  const onChange = jest.fn()
  const palette = [
    { id: 1, name: "navy", rgb: [28, 48, 96] },
    { id: 2, name: "charcoal", rgb: [80, 80, 84] },
  ]
  const { rerender } = render(<PaletteStep palette={palette} paints={[]} detail={2} onSuggest={() => {}} onChange={onChange} onDetail={() => {}} onManagePaints={() => {}} />)
  fireEvent.click(screen.getByRole("button", { name: "Spray charcoal as another colour" }))
  const picker = screen.getByRole("dialog", { name: "Spray charcoal as" })
  fireEvent.click(within(picker).getByRole("button", { name: /navy/ }))
  expect(onChange).toHaveBeenLastCalledWith([palette[0], { ...palette[1], mapTo: [28, 48, 96] }])

  rerender(<PaletteStep palette={[palette[0], { ...palette[1], mapTo: [28, 48, 96] }]} paints={[]} detail={2} onSuggest={() => {}} onChange={onChange} onDetail={() => {}} onManagePaints={() => {}} />)
  expect(screen.getByText(/navy and charcoal share a paint/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "Reset" }))
  expect(onChange).toHaveBeenLastCalledWith([{ ...palette[0], mapTo: undefined }, { ...palette[1], mapTo: undefined }])
})

test("composite sprays selected sheets in order onto bare card", async () => {
  const { composite, CARD } = await import("./composite")
  const pixel = (out, i) => Array.from(out.slice(4 * i, 4 * i + 3))
  const sheets = [
    { order: 1, colour: "paper", kind: "base" },
    { order: 2, colour: "navy", file: "navy.png" },
    { order: 3, colour: "red", file: "red.png" },
  ]
  const masks = { "navy.png": Uint8Array.from([0, 1, 1]), "red.png": Uint8Array.from([0, 0, 1]) }
  const colours = { paper: [250, 250, 250], navy: [0, 0, 100], red: [200, 0, 0] }
  const all = composite({ width: 3, height: 1, sheets, masks, colourOf: (s) => colours[s.colour] })
  expect([0, 1, 2].map((i) => pixel(all, i))).toEqual([[250, 250, 250], [0, 0, 100], [200, 0, 0]])
  const noBase = composite({ width: 3, height: 1, sheets: sheets.slice(1), masks, colourOf: (s) => colours[s.colour] })
  expect(pixel(noBase, 0)).toEqual(CARD)
  const recoloured = composite({ width: 3, height: 1, sheets, masks, colourOf: (s) => (s.colour === "red" ? [0, 200, 0] : colours[s.colour]) })
  expect(pixel(recoloured, 2)).toEqual([0, 200, 0])
})

test("sheets can be left out of the combined preview", async () => {
  const { default: SheetsView } = await import("./components/SheetsView")
  const job = {
    id: "j1",
    status: "done",
    manifest: {
      width: 4, height: 4, margin: 2, units: "px",
      palette: { paper: [250, 250, 250], navy: [0, 0, 100] },
      stats: { "sheet-count": 2, "floating-pieces": 0, strategy: "stints", bridges: 0, style: "none", regions: 2, "timings-ms": {} },
      sheets: [
        { order: 1, name: "paper", colour: "paper", kind: "sheet", file: "paper.png", "view-file": "paper-view.png" },
        { order: 2, name: "navy", colour: "navy", kind: "sheet", file: "navy.png", "view-file": "navy-view.png" },
      ],
    },
  }
  render(<SheetsView job={job} />)
  expect(screen.getByRole("button", { name: /Combine all sheets/ })).toBeEnabled()
  fireEvent.click(screen.getByRole("checkbox", { name: "Include navy in the preview" }))
  expect(screen.getByRole("button", { name: /Combine 1 of 2/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "None" }))
  expect(screen.getByRole("button", { name: /Combine 0 of 2/ })).toBeDisabled()
})
