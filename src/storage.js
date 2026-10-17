// Browser storage. Paints are small and go in localStorage; history keeps source
// images, which are too large for localStorage's few megabytes, so it uses IndexedDB.
// Every call tolerates storage being unavailable (private windows, blocked site data).

const PAINTS_KEY = "grafiture.paints"

export function loadPaints() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PAINTS_KEY) || "[]")
    return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p.name === "string" && Array.isArray(p.rgb)) : []
  } catch {
    return []
  }
}

export function savePaints(paints) {
  try {
    localStorage.setItem(PAINTS_KEY, JSON.stringify(paints))
  } catch {
    // storage full or blocked: paints still work for this session
  }
}

// ---- history (IndexedDB) ------------------------------------------------------

const DB_NAME = "grafiture"
const STORE = "history"
const MAX_ENTRIES = 40

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"))
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function run(mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const result = action(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(result && "result" in result ? result.result : undefined)
        tx.onerror = () => reject(tx.error)
      })
  )
}

export async function loadHistory() {
  try {
    const entries = (await run("readonly", (store) => store.getAll())) || []
    return entries.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

// Saves an entry, keeping only the newest MAX_ENTRIES.
export async function saveHistoryEntry(entry) {
  try {
    await run("readwrite", (store) => store.put(entry))
    const all = await loadHistory()
    await Promise.all(all.slice(MAX_ENTRIES).map((old) => deleteHistoryEntry(old.id)))
  } catch {
    // history is a convenience; a failed save never blocks stencil creation
  }
}

export async function deleteHistoryEntry(id) {
  try {
    await run("readwrite", (store) => store.delete(id))
  } catch {}
}

export async function clearHistory() {
  try {
    await run("readwrite", (store) => store.clear())
  } catch {}
}

// A small JPEG data URL of an image, for history cards.
export function thumbnail(url, size = 240) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", 0.8))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}
