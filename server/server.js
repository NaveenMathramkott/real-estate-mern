import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";

const app = express();
dotenv.config();

//dataBase config
connectDB();

//middleWare

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// app routers
app.use("/api/v1/auth", authRoute);

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
