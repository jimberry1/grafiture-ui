const squareStyle = (rgbString) => {
  return {
    width: "50px",
    height: "50px",
    backgroundColor: rgbString,
    border: "1px solid #000",
    display: "inline-block",
    marginLeft: "10px",
  }
}

const divStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(5, 1fr)" /* Four equal columns and one large section */,
  gap: "10px" /* Adjust the gap between the columns and main section */,
  padding: "10px",
  alignItems: "center", // Align items vertically to the center
  justifyItems: "center",
}

const ColourSquare = ({ rgb }) => {
  const [r, g, b] = rgb
  const rgbString = `rgb(${rgb.join(", ")})`

  return (
    <div>
      <div style={divStyle}>
        <div style={squareStyle(rgbString)}></div>
        <span>R: {r}</span>
        <span>G: {g}</span>
        <span>B: {b}</span>

        <button
          onClick={() => {
            navigator.clipboard.writeText(`${r} ${g} ${b}`)
          }}
        >
          Copy to clipboard
        </button>
      </div>
    </div>
  )
}

const ColourSquares = ({ colours }) => {
  return (
    <div>
      {colours.map((colour, i) => (
        <ColourSquare rgb={colour} key={`rgb-col-${i}`} />
      ))}
    </div>
  )
}

export default ColourSquares
