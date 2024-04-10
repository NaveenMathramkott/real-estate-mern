import mongoose from "mongoose";

const typeSchema = new mongoose.Schema({
  enum: ["rent", "buy"],
});

export default mongoose.model("type", typeSchema);
