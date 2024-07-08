import { ImageColorPicker } from "react-image-color-picker"

const ImgColourPicker = ({ img, onColourSelected }) => {
  const handleColorPick = (color) => {
    const regex = /rgb\((\d+), (\d+), (\d+)\)/

    const match = color.match(regex)

    if (match) {
      const red = parseInt(match[1])
      const green = parseInt(match[2])
      const blue = parseInt(match[3])

      onColourSelected([red, green, blue])
    } else {
      console.log("No match found")
    }
  }

  return (
    <div>
      <h1>Image Color Picker Demo</h1>
      <ImageColorPicker onColorPick={handleColorPick} imgSrc={img} zoom={1} />
    </div>
  )
}

export default ImgColourPicker
