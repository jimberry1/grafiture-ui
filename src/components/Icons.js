// Line icons on a 20px grid, drawn with currentColor so they follow the text colour.

const Svg = ({ size = 18, children, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {children}
  </svg>
)

export const Logo = (props) => (
  <Svg {...props}>
    <path d="M4 4h12v12H4z" />
    <path d="M7.5 7.5h2v2h-2zM10.5 10.5h2v2h-2z" fill="currentColor" stroke="none" />
  </Svg>
)

export const Upload = (props) => (
  <Svg {...props}>
    <path d="M10 13V3.5M6.5 7 10 3.5 13.5 7" />
    <path d="M3.5 12.5v2A2 2 0 0 0 5.5 16.5h9a2 2 0 0 0 2-2v-2" />
  </Svg>
)

export const Chevron = (props) => (
  <Svg {...props}>
    <path d="m6 8 4 4 4-4" />
  </Svg>
)

export const ChevronRight = (props) => (
  <Svg {...props}>
    <path d="m8 6 4 4-4 4" />
  </Svg>
)

export const Close = (props) => (
  <Svg {...props}>
    <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />
  </Svg>
)

export const Pipette = (props) => (
  <Svg {...props}>
    <path d="m11.5 5.5 3 3M4 16l1-3 6.5-6.5 2 2L7 15l-3 1Z" />
    <path d="m12.5 4.5 1.3-1.3a1.4 1.4 0 0 1 2 2L14.5 6.5" />
  </Svg>
)

export const Sparkle = (props) => (
  <Svg {...props}>
    <path d="M10 3.5v3M10 13.5v3M3.5 10h3M13.5 10h3M5.4 5.4l2.1 2.1M12.5 12.5l2.1 2.1M14.6 5.4l-2.1 2.1M7.5 12.5l-2.1 2.1" />
  </Svg>
)

export const Copy = (props) => (
  <Svg {...props}>
    <rect x="7" y="7" width="9" height="9" rx="2" />
    <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7" />
  </Svg>
)

export const Trash = (props) => (
  <Svg {...props}>
    <path d="M4.5 6h11M8 6V4.5h4V6M6 6l.7 9.5h6.6L14 6" />
  </Svg>
)

export const Download = (props) => (
  <Svg {...props}>
    <path d="M10 3.5V13M6.5 9.5 10 13l3.5-3.5" />
    <path d="M4 16.5h12" />
  </Svg>
)

export const Check = (props) => (
  <Svg {...props}>
    <path d="m5 10.5 3 3 7-7" />
  </Svg>
)

export const Alert = (props) => (
  <Svg {...props}>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 6.5v4M10 13.3v.2" />
  </Svg>
)

export const Spray = (props) => (
  <Svg {...props}>
    <rect x="6" y="7" width="7" height="10" rx="1.5" />
    <path d="M8 7V4.5h3V7M11 4.5h1.5M14.5 3.5l1.5-.5M14.5 5.5l1.5.5M15 4.5h1.5" />
  </Svg>
)

export const Info = (props) => (
  <Svg {...props}>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 9v4.5M10 6.5v.2" />
  </Svg>
)

export const Gear = (props) => (
  <Svg {...props}>
    <circle cx="10" cy="10" r="2.5" />
    <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" />
  </Svg>
)

export const Clock = (props) => (
  <Svg {...props}>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 6v4l2.5 2.5" />
  </Svg>
)

export const Plus = (props) => (
  <Svg {...props}>
    <path d="M10 4.5v11M4.5 10h11" />
  </Svg>
)

export const Palette = (props) => (
  <Svg {...props}>
    <path d="M10 3a7 7 0 1 0 0 14c1 0 1.5-.7 1.5-1.4 0-1-.9-1.3-.9-2.1 0-.8.7-1.5 1.5-1.5H14a3 3 0 0 0 3-3C17 5.6 13.9 3 10 3Z" />
    <circle cx="6.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </Svg>
)

// Small illustrations for the style cards.
export const StyleArt = ({ style }) => {
  const common = { width: "100%", height: "100%", viewBox: "0 0 160 100", "aria-hidden": true }
  switch (style) {
    case "edges":
      return (
        <svg {...common}>
          <rect width="160" height="100" fill="#0d0d0c" />
          <g fill="none" stroke="#f3f1ec" strokeWidth="1.6">
            <path d="M30 70c10-30 30-42 50-42s40 12 50 42" />
            <path d="M48 70c6-18 18-26 32-26s26 8 32 26" />
            <circle cx="80" cy="56" r="6" />
            <path d="M20 82h120" opacity="0.5" />
          </g>
        </svg>
      )
    case "contour-lines":
      return (
        <svg {...common}>
          <rect width="160" height="100" fill="#fbfaf7" />
          <g fill="none" stroke="#151412" strokeWidth="2.2">
            {[14, 26, 38, 50, 62, 74, 86].map((y, i) => (
              <path key={y} d={`M0 ${y} C 40 ${y} 55 ${y - (i > 1 && i < 6 ? 12 : 2)} 80 ${y - (i > 1 && i < 6 ? 14 : 2)} S 120 ${y} 160 ${y}`} />
            ))}
          </g>
        </svg>
      )
    case "pointillism":
      return (
        <svg {...common}>
          <rect width="160" height="100" fill="#fbfaf7" />
          {Array.from({ length: 9 }, (_, row) =>
            Array.from({ length: 15 }, (_, col) => {
              const x = 8 + col * 10.4 + (row % 2 ? 5.2 : 0)
              const y = 8 + row * 10.5
              const inside = (x - 80) ** 2 / 1600 + (y - 50) ** 2 / 900 < 1
              return <circle key={`${row}-${col}`} cx={x} cy={y} r="4.6" fill={inside ? (row < 4 ? "#f2b400" : "#e0761b") : "#5aa6dc"} />
            })
          )}
        </svg>
      )
    case "halftone":
      return (
        <svg {...common}>
          <rect width="160" height="100" fill="#fbfaf7" />
          {Array.from({ length: 10 }, (_, r) => Array.from({ length: 16 }, (_, c) => (
            <circle key={`${r}-${c}`} cx={6 + c * 10} cy={5 + r * 10} r={4.6 * (c / 16)} fill="#151412" />
          )))}
        </svg>
      )
    case "crosshatch":
      return (
        <svg {...common}>
          <rect width="160" height="100" fill="#fbfaf7" />
          <g stroke="#151412" strokeWidth="1.4">
            {Array.from({ length: 26 }, (_, i) => <line key={`a${i}`} x1={i * 8 - 60} y1="0" x2={i * 8 + 40} y2="100" />)}
            {Array.from({ length: 14 }, (_, i) => <line key={`b${i}`} x1={i * 8 + 60} y1="0" x2={i * 8 - 40} y2="100" />)}
          </g>
        </svg>
      )
    case "stained-glass":
      return (
        <svg {...common}>
          <rect width="160" height="100" fill="#1e1e1e" />
          {[["M2 2h50l-8 40H2z", "#3d6ea0"], ["M56 2h56l6 36-60 6z", "#e8c873"], ["M116 2h42v50l-36-10z", "#9cc7e8"], ["M2 46h40l14 52H2z", "#c0503a"], ["M48 48l60-6 4 56H60z", "#2c4a6b"], ["M116 46l42 10v42h-42z", "#6aa36a"]].map(([d, f]) => (
            <path key={d} d={d} fill={f} />
          ))}
        </svg>
      )
    case "low-poly":
      return (
        <svg {...common}>
          {[["0,0 60,0 30,50", "#9cc7e8"], ["60,0 30,50 100,40", "#7fb0d8"], ["60,0 160,0 100,40", "#b9d9f0"], ["160,0 100,40 160,60", "#8fbce0"], ["0,0 30,50 0,100", "#2c4a6b"], ["30,50 100,40 70,100", "#3d6ea0"], ["0,100 30,50 70,100", "#24405e"], ["100,40 160,60 70,100", "#4f80b0"], ["160,60 160,100 70,100", "#36618d"]].map(([pts, f]) => (
            <polygon key={pts} points={pts} fill={f} />
          ))}
        </svg>
      )
    case "poster":
      return (
        <svg {...common}>
          <rect width="160" height="100" fill="#e8d5a8" />
          <path d="M0 70C40 40 70 30 100 45s45 10 60 0V100H0Z" fill="#c0392b" stroke="#141414" strokeWidth="4" />
          <circle cx="58" cy="36" r="18" fill="#1d3557" stroke="#141414" strokeWidth="4" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="none-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9cc7e8" />
              <stop offset="1" stopColor="#e8eef2" />
            </linearGradient>
          </defs>
          <rect width="160" height="100" fill="url(#none-sky)" />
          <path d="M0 78 46 40l26 22 22-16 66 32v22H0Z" fill="#2c4a6b" />
          <circle cx="122" cy="28" r="10" fill="#f6c443" />
        </svg>
      )
  }
}
