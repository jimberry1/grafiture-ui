// Client for the grafiture API. The base URL can be set with REACT_APP_API_URL.

export const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8080").replace(/\/$/, "")

async function errorMessage(response) {
  try {
    const body = await response.json()
    return body.error || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export async function healthcheck() {
  const response = await fetch(`${API_URL}/api/healthcheck`)
  return response.ok
}

// Builds the multipart form shared by preview and job requests.
export function stencilForm({ file, palette, maxSize, style, styleOptions, minRegionSize, ...rest }) {
  const form = new FormData()
  form.append("image", file)
  if (palette && palette.length) {
    form.append("key-colours", JSON.stringify(Object.fromEntries(palette.map((c) => [c.name, c.rgb]))))
  }
  if (maxSize) form.append("max-size", String(maxSize))
  if (style && style !== "none") {
    form.append("style", style)
    form.append("style-options", JSON.stringify(styleOptions || {}))
  }
  if (minRegionSize != null) form.append("min-region-size", String(minRegionSize))
  Object.entries(rest).forEach(([field, value]) => {
    if (value != null && value !== "") form.append(field, String(value))
  })
  return form
}

// Returns { url, regions } for the image as it goes into stencil creation.
export async function preview(options, { view, signal }) {
  const form = stencilForm(options)
  form.append("view", view)
  const response = await fetch(`${API_URL}/api/preview`, { method: "POST", body: form, signal })
  if (!response.ok) throw new Error(await errorMessage(response))
  const regions = response.headers.get("X-Grafiture-Regions")
  return { url: URL.createObjectURL(await response.blob()), regions: regions ? Number(regions) : null }
}

// Which strategy suits the image, with estimated sheets and bridges for each. Runs on
// the server off the job queue, so it never delays stencil creation.
export async function recommend(options, { signal } = {}) {
  const response = await fetch(`${API_URL}/api/recommend`, { method: "POST", body: stencilForm(options), signal })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json()
}

export async function submitJob(options) {
  const response = await fetch(`${API_URL}/api/jobs`, { method: "POST", body: stencilForm(options) })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json()
}

export async function jobStatus(id, { signal } = {}) {
  const response = await fetch(`${API_URL}/api/jobs/${id}`, { signal })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json()
}

export const jobFileUrl = (id, file) => `${API_URL}/api/jobs/${id}/files/${file}`
export const jobZipUrl = (id) => `${API_URL}/api/jobs/${id}/sheets.zip`
