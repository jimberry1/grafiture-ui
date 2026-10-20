import { useCallback, useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Info } from "./Icons"

const WIDTH = 320
const GAP = 12
const MARGIN = 12

// An ⓘ button that explains something on hover or keyboard focus, and on tap for touch
// screens. The tip is portalled to the page so scrolling panels can't clip it, and is
// placed beside the button, flipping and clamping to stay on screen.
export default function InfoTip({ label, children }) {
  const button = useRef(null)
  const tip = useRef(null)
  const id = useId()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)

  const place = useCallback(() => {
    const rect = button.current?.getBoundingClientRect()
    if (!rect) return
    const height = tip.current?.offsetHeight || 0
    const fitsRight = rect.right + GAP + WIDTH + MARGIN <= window.innerWidth
    const left = fitsRight
      ? rect.right + GAP
      : Math.max(MARGIN, Math.min(rect.left - WIDTH / 2, window.innerWidth - WIDTH - MARGIN))
    const top = fitsRight
      ? Math.max(MARGIN, Math.min(rect.top - 16, window.innerHeight - height - MARGIN))
      : rect.bottom + GAP
    setPosition({ left, top })
  }, [])

  useEffect(() => {
    if (!open) return
    place()
    const frame = requestAnimationFrame(place) // again once the tip's height is known
    const close = (e) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", close)
    window.addEventListener("scroll", place, true)
    window.addEventListener("resize", place)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("keydown", close)
      window.removeEventListener("scroll", place, true)
      window.removeEventListener("resize", place)
    }
  }, [open, place])

  return (
    <>
      <button
        ref={button}
        type="button"
        className="info-btn"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          // inside a label: don't select the card's radio when asking about it
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <Info size={15} />
      </button>
      {open &&
        createPortal(
          <div ref={tip} id={id} role="tooltip" className="info-tip"
            style={{ width: WIDTH, left: position?.left ?? -9999, top: position?.top ?? -9999 }}>
            {children}
          </div>,
          document.body
        )}
    </>
  )
}
