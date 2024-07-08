const ImgUpload = ({ onImgSelected }) => {
  return (
    <div>
      <input type="file" onChange={(e) => onImgSelected(e.target.files[0])} />
    </div>
  )
}

export default ImgUpload
