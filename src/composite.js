// Simulates spraying stencil sheets, in the browser, so a result can be previewed with
// sheets left out or paints changed without cutting anything new.

// Bare card shows where no sheet sprays.
export const CARD = [244, 241, 234]

// Reads a sheet mask PNG into a boolean array over the image (true = cut, so sprayed),
// dropping the uncut frame around it.
export function readMask(img, width, height, margin) {
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const full = canvas.width
  const cut = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // cut pixels are transparent in a mask
      cut[y * width + x] = data[4 * ((y + margin) * full + (x + margin)) + 3] < 128 ? 1 : 0
    }
  }
  return cut
}

// Sprays `sheets` in order into RGBA pixels. A base coat paints everything; other
// sheets paint where their mask is cut. `colourOf(sheet)` gives each sheet's paint.
export function composite({ width, height, sheets, masks, colourOf }) {
  const n = width * height
  const out = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n; i++) {
    out[4 * i] = CARD[0]
    out[4 * i + 1] = CARD[1]
    out[4 * i + 2] = CARD[2]
    out[4 * i + 3] = 255
  }
  for (const sheet of sheets) {
    const [r, g, b] = colourOf(sheet)
    const mask = sheet.file ? masks[sheet.file] : null
    if (sheet.file && !mask) continue
    for (let i = 0; i < n; i++) {
      if (!mask || mask[i]) {
        out[4 * i] = r
        out[4 * i + 1] = g
        out[4 * i + 2] = b
      }
    }
  }
  return out
}
