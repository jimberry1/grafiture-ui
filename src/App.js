import React, { useState } from "react"
import logo from "./logo.svg"
import "./App.css"
import Palette from "./Palette"
import ColourSquares from "./ColourSquare"
import ImgUpload from "./ImgUpload"
import SendImage from "./SendImage"
import ImgColourPicker from "./ImgColourPicker"

function App() {
  const [img, setImg] = useState(null)
  const [imgUrl, setImgUrl] = useState(null)
  const [imgColours, setImgColours] = useState([])

  console.log(imgColours)

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <ImgUpload
          onImgSelected={(file) => {
            setImg(file)
            setImgUrl(URL.createObjectURL(file))
          }}
        />

        {img && (
          <ImgColourPicker
            img={imgUrl}
            onColourSelected={(newRGB) =>
              setImgColours((curCols) => [...curCols, newRGB])
            }
          />
        )}

        {/* <Palette
          numOfColours={3}
          selectedImage={imgUrl}
          updatePalette={setImgColours}
        /> */}
        {/* {imgColours.map((rgb, i) => (
          <ColourSquare rgb={rgb} key={`rgb-col-${i}`} />
        ))} */}

        <ColourSquares colours={imgColours} />

        <button onClick={() => setImgColours([])}>Reset colour choices</button>

        <SendImage img={img} colours={imgColours} />
      </header>
    </div>
  )
}

export default App
