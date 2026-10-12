import mongoose from "mongoose";

const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    developer: {
      type: String,
      trim: true,
    },
    yearBuilt: {
      type: Number,
    },
    amenities: {
      type: [String],
      default: [],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true },
);

buildingSchema.index({ location: "2dsphere" });

export default mongoose.model("building", buildingSchema);
