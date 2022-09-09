import React, { useState, useMemo , } from "react";
import {useSelector , useDispatch} from "react-redux"
import "./ListUploadForm.css";
import { useForm } from "react-hook-form";

function ListUploadForm() {
  const dispatch = useDispatch()
  const user = JSON.parse(localStorage.getItem('user'));
  const initialFormValues = {
    listing_name: "",
    description: "",
    location: "",
    latitude: "",
    price: "",
    listing_type: "flat",
    isFurnished: "fully_furnished",
    room_type: "1BHK",
    file: ""
  }
  const formData = [
  { name: "listing_name", type: "text", label: "Property Name" },
  { type: "textarea", name: "description", label: "Property description" },
  { name: "location", type: "text", label: "Property Location" },
  { name: "latitude", type: "text", label: "Property Latitude" },
  { name: "price", type: "text", label: "Property Price" },
  {
    name: "listing_type", type: "select",
    label: "Flat Type", options: [{ value: "flat", label: "Flat" }, { value: "villa", label: "Villa" }]
  },
  {
    name: "isFurnished", type: "select",
    label: "Furnish Type",
    options: [{ value: "fully_furnished", label: "Fully Furnished" }, { value: "semi_furnished", label: "Semi Furnished" }]
  },
  {
    name: "room_type", type: "select",
    label: "BHK Type",
    options: [{ value: "1BHK", label: "1 BHK" },
    { value: "2BHK", label: "2 BHK" },
    { value: "3BHK", label: "3 BHK" },
    { value: "4BHK", label: "4 BHK" }]
  },
  { type: "file" ,name:"file"}
  ]

  const { register, reset, handleSubmit, getValues } = useForm({
    defaultValues: useMemo(() => {
      return initialFormValues
    }, []),
  })
  // const [file, setFile] = React.useState("");
  // const [listFormValue, setListFormValue] = useState({
  //   name: "",
  //   description: "",
  //   price: "",
  //   location: "",
  //   latitude: "",

  // });
  // const handleChange = (event) => {
  //   setListFormValue({
  //     ...listFormValue,
  //     [event.target.name]: event.target.value,
  //   });
  //   setFile(event.target.files[0]);
  // };
const onSubmit = async (data)=>{

const formData = new FormData();
formData.append("dataFile", data.file[0]);
delete data.file
for (let i in data  ){
  if (i !== "data"){
    formData.append([i], data[i]);
  }
}
formData.append("user_id" , user?.email)
await dispatch.home.addrentalFromAdmin(formData)
// console.log(formData, "formData")

}
  return (
    <form className="listUpLoad_form" onSubmit={handleSubmit((data) =>onSubmit(data))}>
      <h3>Property Upload</h3>
      <div className="listUpload_input">
        {formData.map((item) => {
          return item.type === "text" ?
            <>
              <label>{item.label}</label>
              <input
                type="text"
                placeholder={item.label}
                {...register(item.name)}
              />
            </>
            :
            item.type === "textarea" ? <>
              <label>{item.label}</label>
              <textarea
                type="text"
                placeholder={item.label}
                {...register(item.name)}
              />
            </> :
              null
        })}

      </div>
      <div className="submit_form">
        {formData.map((item) =>
          item.type === "select" ?
            <select
              className="selectList"
              {...register(item.name)}
            >
              {item.options.map((opts) =>
                <option value={opts.value}>{opts.label}</option>
              )
              }
            </select> : item.type === "file" ? <input type="file" {...register(item.name)} multiple accept="image/*" /> : null
        )}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

export default ListUploadForm;
