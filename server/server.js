import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { swaggerDocument, API_PREFIX } from "./config/swagger/index.js";
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
import areaRoute from "./routes/areaRoute.js";
import buildingRoute from "./routes/buildingRoute.js";
import agencyRoute from "./routes/agencyRoute.js";
import profileRoute from "./routes/profileRoute.js";

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

// API docs — interactive UI at /api-docs, raw spec at /api-docs.json
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api-docs.json", (req, res) => res.json(swaggerDocument));

// health check
app.get(`${API_PREFIX}/health`, (req, res) =>
  res.status(200).json({ success: true, status: "ok" }),
);

// app routers — mounted from API_PREFIX so the docs stay in sync
app.use(`${API_PREFIX}/auth`, authRoute);
app.use(`${API_PREFIX}/properties`, propertyRoute);
app.use(`${API_PREFIX}/search`, searchRoute);
app.use(`${API_PREFIX}/favorites`, favoriteRoute);
app.use(`${API_PREFIX}/saved-searches`, savedSearchRoute);
app.use(`${API_PREFIX}/inquiries`, inquiryRoute);
app.use(`${API_PREFIX}/conversations`, conversationRoute);
app.use(`${API_PREFIX}/notifications`, notificationRoute);
app.use(`${API_PREFIX}/reviews`, reviewRoute);
app.use(`${API_PREFIX}/areas`, areaRoute);
app.use(`${API_PREFIX}/buildings`, buildingRoute);
app.use(`${API_PREFIX}/agencies`, agencyRoute);
app.use(`${API_PREFIX}/profiles`, profileRoute);

// Realtime — chat and notifications
initSocket(server, process.env.CLIENT_URL);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
