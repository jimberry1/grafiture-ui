import { useEffect } from "react"

// Runs `effect` once its dependencies have been still for `delay` ms. The effect is
// given an AbortSignal that fires when the dependencies change again, so stale
// requests are cancelled rather than racing the new one.
export default function useDebouncedEffect(effect, deps, delay = 350) {
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => effect(controller.signal), delay)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
