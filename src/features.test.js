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
