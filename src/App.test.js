import { render, screen } from "@testing-library/react"
import App from "./App"

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))
})

test("starts on the upload step", () => {
  render(<App />)
  expect(screen.getByText(/Drop an image, or click to browse/i)).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /Create stencil/i })).toBeDisabled()
})
