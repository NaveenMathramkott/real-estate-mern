import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  enum: ["apartment", "house", "land", "condo"],
});

export default mongoose.model("property", propertySchema);
