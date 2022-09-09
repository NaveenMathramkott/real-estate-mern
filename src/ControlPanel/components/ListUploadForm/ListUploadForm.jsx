import React, { useState } from "react";
import "./ListUploadForm.css";

function ListUploadForm() {
  const [file, setFile] = React.useState("");
  const [listFormValue, setListFormValue] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    latitude: "",
    selectedFlatType: "",
    selectedFurnishType: "",
    selectedBhkType: "",
  });
  const handleChange = (event) => {
    setListFormValue({
      ...listFormValue,
      [event.target.name]: event.target.value,
    });
    setFile(event.target.files[0]);
  };

  return (
    <form className="listUpLoad_form" onsubmit={() => {}}>
      <h3>Property Upload</h3>
      <div className="listUpload_input">
        <label>Property Name</label>
        <input
          type="text"
          placeholder="Property Name"
          name="name"
          onChange={handleChange}
        />
        <label>Property Description</label>
        <textarea type="text" name="description" onChange={handleChange} />
        <label>Property Price</label>
        <input
          type="text"
          placeholder="Property Price"
          name="price"
          onChange={handleChange}
        />
        <label>Property Location</label>
        <input
          type="text"
          placeholder="Property Location"
          name="location"
          onChange={handleChange}
        />
        <label>Property Latitude</label>
        <input
          type="text"
          placeholder="Property Latitude"
          name="latitude"
          onChange={handleChange}
        />
      </div>
      <div className="submit_form">
        <select
          className="selectList"
          name="selectedFlatType"
          onChange={handleChange}
        >
          <option value="flat">Flat</option>
          <option value="villa">Villa</option>
        </select>
        <select
          className="selectList"
          name="selectedFurnishType"
          onChange={handleChange}
        >
          <option value="semi furnished">Semi Furnished</option>
          <option value="fully furnished">Fully Furnished</option>
        </select>
        <select
          className="selectList"
          name="selectedBhkType"
          onChange={handleChange}
        >
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
          <option value="4">4 BHK</option>
        </select>

        <input type="file" multiple accept="image/*" />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

export default ListUploadForm;
