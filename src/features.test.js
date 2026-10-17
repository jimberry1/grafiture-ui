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
