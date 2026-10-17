// Colour helpers: hex conversion, readable names for picked colours, and sampling.

export const toHex = ([r, g, b]) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")

export const fromHex = (hex) => {
  const v = hex.replace("#", "")
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16))
}

// Perceived lightness, 0 to 1, used to pick readable text over a colour.
export const lightness = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255

const NAMED = {
  black: [20, 20, 20],
  charcoal: [62, 62, 64],
  grey: [128, 128, 128],
  silver: [192, 192, 192],
  "light-grey": [218, 218, 218],
  white: [245, 245, 245],
  cream: [240, 228, 200],
  tan: [210, 180, 140],
  brown: [120, 75, 40],
  red: [215, 40, 40],
  crimson: [150, 20, 40],
  orange: [245, 140, 30],
  yellow: [245, 215, 40],
  olive: [110, 120, 50],
  lime: [170, 220, 60],
  green: [60, 160, 80],
  forest: [30, 90, 50],
  teal: [30, 150, 150],
  cyan: [90, 200, 230],
  sky: [140, 190, 230],
  blue: [45, 100, 200],
  navy: [25, 40, 95],
  purple: [130, 60, 170],
  pink: [240, 120, 180],
}

const distance = (a, b) => a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0)

// The nearest readable name, made unique among `taken` with a numeric suffix.
export function nameFor(rgb, taken = []) {
  const [base] = Object.entries(NAMED).reduce((best, entry) =>
    distance(entry[1], rgb) < distance(best[1], rgb) ? entry : best
  )
  let name = base
  for (let i = 2; taken.includes(name); i++) name = `${base}-${i}`
  return name
}

// Colour names become file names on the server, so keep them to a-z, 0-9 and dashes.
export const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)

let nextId = 1
export const paletteEntry = (rgb, taken) => ({ id: nextId++, rgb, name: nameFor(rgb, taken) })

// Reads pixels from an image URL. The canvas is cached per URL, since sampling
// happens on every mouse move over the stage.
const canvases = new Map()

export function samplerFor(url) {
  if (canvases.has(url)) return canvases.get(url)
  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)
      resolve({
        width: canvas.width,
        height: canvas.height,
        at: (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3)),
      })
    }
    img.onerror = reject
    img.src = url
  })
  canvases.set(url, promise)
  return promise
}

// Suggests a palette with k-means on a sample of the image's pixels. Seeded with the
// darkest and lightest pixels then spread by distance, so results are stable.
export async function suggestPalette(url, count) {
  const { width, height, at } = await samplerFor(url)
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 6000)))
  const pixels = []
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) pixels.push(at(x, y))

  const centres = [pixels.reduce((a, b) => (lightness(b) < lightness(a) ? b : a))]
  while (centres.length < count) {
    centres.push(pixels.reduce((best, p) => {
      const d = Math.min(...centres.map((c) => distance(c, p)))
      return d > best.d ? { p, d } : best
    }, { p: pixels[0], d: -1 }).p)
  }
  for (let iteration = 0; iteration < 12; iteration++) {
    const sums = centres.map(() => [0, 0, 0, 0])
    pixels.forEach((p) => {
      let best = 0
      centres.forEach((c, i) => { if (distance(c, p) < distance(centres[best], p)) best = i })
      sums[best][0] += p[0]; sums[best][1] += p[1]; sums[best][2] += p[2]; sums[best][3] += 1
    })
    sums.forEach((s, i) => { if (s[3]) centres[i] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]].map(Math.round) })
  }
  return centres.sort((a, b) => lightness(a) - lightness(b))
}
