import mongoose from "mongoose";

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    boundary: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },
      coordinates: {
        // [[[lng, lat], ...]] — GeoJSON Polygon ring(s)
        type: [[[Number]]],
        required: true,
      },
    },
  },
  { timestamps: true },
);

// 2dsphere so area boundaries can be tested with $geoIntersects
areaSchema.index({ boundary: "2dsphere" });

export default mongoose.model("area", areaSchema);
