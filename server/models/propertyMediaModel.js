import mongoose from "mongoose";

const propertyMediaSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "floorplan", "tour"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    blurhash: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

propertyMediaSchema.index({ propertyId: 1, order: 1 });

export default mongoose.model("propertyMedia", propertyMediaSchema);
