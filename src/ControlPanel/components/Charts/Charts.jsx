import React from "react";
import "./Charts.css";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip } from "recharts";

const Chart = ({ title, width = 830, height = 260 }) => {
  const data = [
    { name: "January", Total: 1200 },
    { name: "February", Total: 1100 },
    { name: "March", Total: 300 },
    { name: "April", Total: 700 },
    { name: "May", Total: 1300 },
    { name: "June", Total: 800 },
  ];
  return (
    <div className="chart">
      <div className="chartContent">
        <h1 className="title">{title}</h1>
        <AreaChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="Total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#27ae60" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#27ae60" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" />

          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="Total"
            stroke="#000"
            fillOpacity={1}
            fill="url(#Total)"
          />
        </AreaChart>
      </div>
    </div>
  );
};

export default Chart;
