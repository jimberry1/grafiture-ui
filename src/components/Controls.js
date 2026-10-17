// Form controls from the design system.

export function Slider({ label, value, min, max, step = 1, format = (v) => v, hint, onChange }) {
  const fill = `${((value - min) / (max - min)) * 100}%`
  return (
    <label className="field">
      <span className="field-head">
        <span className="field-label">{label}</span>
        <span className="field-value">{format(value)}</span>
      </span>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--fill": fill }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  )
}

// A number input where empty means "automatic".
export function NumberField({ label, hint, value, min, max, placeholder = "auto", onChange }) {
  return (
    <label className="inline-field">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input
        className="number-input"
        type="number"
        step="any"
        min={min}
        max={max}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? null : Math.max(min, Math.min(max, Number(e.target.value))))}
      />
    </label>
  )
}

export function Step({ number, title, summary, open, done, locked, onToggle, children }) {
  const classes = ["step", open && "is-open", done && !open && "is-done", locked && "is-locked"].filter(Boolean).join(" ")
  return (
    <section className={classes} inert={locked ? "" : undefined}>
      <button type="button" className="step-head" aria-expanded={open} onClick={onToggle}>
        <span className="step-num">{number}</span>
        <span className="step-title">
          <strong>{title}</strong>
          {summary && <span className="step-summary">{summary}</span>}
        </span>
        <svg className="step-chevron" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </button>
      {open && <div className="step-body">{children}</div>}
    </section>
  )
}
