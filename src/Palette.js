import { useRef } from "react"
import ColorThief from "colorthief"

const Palette = ({ numOfColours, selectedImage, updatePalette }) => {
  const imgRef = useRef()
  const img = (
    <img
      style={{ display: "none" }}
      crossOrigin={"anonymous"}
      ref={imgRef}
      src={selectedImage}
      alt={"example"}
      className={"example__img"}
      onLoad={() => {
        const colorThief = new ColorThief()
        const img = imgRef.current
        const result = colorThief.getPalette(img, numOfColours)
        updatePalette(result)
      }}
    />
  )

  return <>{img}</>
}

export default Palette
