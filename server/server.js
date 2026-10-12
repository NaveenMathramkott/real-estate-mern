import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoute from "./routes/authRoute.js";
import propertyRoute from "./routes/propertyRoute.js";
import searchRoute from "./routes/searchRoute.js";
import favoriteRoute from "./routes/favoriteRoute.js";
import savedSearchRoute from "./routes/savedSearchRoute.js";
import inquiryRoute from "./routes/inquiryRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import notificationRoute from "./routes/notificationRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import areaRoute, { buildingRouter } from "./routes/areaRoute.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

//dataBase config
connectDB();

//middleWare
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Global ceiling to blunt abuse across every route
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// health check
app.get("/api/v1/health", (req, res) =>
  res.status(200).json({ success: true, status: "ok" }),
);

// app routers
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/properties", propertyRoute);
app.use("/api/v1/search", searchRoute);
app.use("/api/v1/favorites", favoriteRoute);
app.use("/api/v1/saved-searches", savedSearchRoute);
app.use("/api/v1/inquiries", inquiryRoute);
app.use("/api/v1/conversations", conversationRoute);
app.use("/api/v1/notifications", notificationRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/areas", areaRoute);
app.use("/api/v1/buildings", buildingRouter);

// Realtime — chat and notifications
initSocket(server, process.env.CLIENT_URL);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
