import React from "react";
import "./Charts.css";
import {
  BarChart,
  YAxis,
  XAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

const Chart = ({ title, width = 830, height = 260 }) => {
  const data = [
    {
      name: "Page A",
      uv: 4000,
      pv: 2400,
    },
    {
      name: "Page B",
      uv: 3000,
      pv: 1398,
    },
    {
      name: "Page C",
      uv: 2000,
      pv: 9800,
    },
    {
      name: "Page D",
      uv: 2780,
      pv: 3908,
    },
    {
      name: "Page E",
      uv: 1890,
      pv: 4800,
    },
    {
      name: "Page F",
      uv: 2390,
      pv: 3800,
    },
    {
      name: "Page G",
      uv: 3490,
      pv: 4300,
    },
  ];
  return (
    <div className="chartContent">
      <h1 className="title">{title}</h1>
      <BarChart width={width} height={height} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="uv" fill="#27ae60" />
        <Bar dataKey="pv" fill="#82ca9d" />
      </BarChart>
    </div>
  );
};

export default Chart;
