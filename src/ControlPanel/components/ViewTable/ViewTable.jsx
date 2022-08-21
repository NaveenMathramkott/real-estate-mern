import React from "react";
import "./ViewTable.css";

const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    width: 100,
  },
  {
    title: "Age",
    dataIndex: "age",
    key: "age",
    width: 100,
  },
  {
    title: "Address",
    dataIndex: "address",
    key: "address",
    width: 200,
  },
  {
    title: "Operations",
    dataIndex: "",
    key: "operations",
    render: () => <p>Delete</p>,
  },
];

const data = [
  { name: "Jack", age: 28, address: "some where", key: "1" },
  { name: "Rose", age: 36, address: "some where", key: "2" },
];
function ViewTable() {
  return (
    <>
      <div className="viewMainContainer">
        <div className="viewTableContainer"></div>
      </div>
    </>
  );
}

export default ViewTable;
