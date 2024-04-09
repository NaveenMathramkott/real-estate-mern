import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
console.log(process.env.PORT);

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
