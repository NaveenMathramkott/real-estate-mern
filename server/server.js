import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import postRoute from "./routes/postRoute.js";

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
app.use("/api/v1/users", userRoute);
app.use("/api/v1/posts", postRoute);
// app.use("/api/v1/chats", chatRoute);

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
