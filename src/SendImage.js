import React, { useState } from "react"

const coloursToColourMap = (colours) => {
  const resultMap = {}

  // Iterate over each array and add it to the resultMap
  colours.forEach((values, index) => {
    resultMap[index.toString()] = values
  })
  return resultMap
}
const SendImage = ({ img, colours }) => {
  const [file, setFile] = useState(null)
  const [imageSrc, setImageSrc] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handlePreview = async (e) => {
    e.preventDefault()

    if (!img) {
      alert("Please select a file first!")
      return
    }

    const formData = new FormData()
    formData.append("image", img)

    // Add JSON object as a string
    const keyColourMap = coloursToColourMap(colours)
    const jsonObject = JSON.stringify(keyColourMap)
    formData.append("key-colours", jsonObject)

    try {
      const response = await fetch(`http://localhost:8080/api/preview`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const result = await response.blob()

      const imageUrl = URL.createObjectURL(result)
      // Set the image URL to state to display it
      setImageSrc(imageUrl)

      console.log("Success:", result)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleCreateStencil = async (e) => {
    e.preventDefault()

    if (!img) {
      alert("Please select a file first!")
      return
    }

    const formData = new FormData()
    formData.append("image", img)

    // Add JSON object as a string
    const keyColourMap = coloursToColourMap(colours)
    const jsonObject = JSON.stringify(keyColourMap)
    formData.append("key-colours", jsonObject)

    try {
      const response = await fetch(`http://localhost:8080/api/create-stencil`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const result = await response.json()

      console.log("Success:", result)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const formButtonStyle = { width: 100, padding: 5 }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <form onSubmit={handlePreview}>
        <button style={formButtonStyle} type="submit">
          Upload Image
        </button>
      </form>
      {imageSrc && <img src={imageSrc} alt="Uploaded" />}
      <button style={formButtonStyle} onClick={handleCreateStencil}>
        Create stencil
      </button>
    </div>
  )
}

export default SendImage
