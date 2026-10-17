import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["apartment", "villa", "plot", "commercial", "farmhouse"],
      required: true,
    },
    purpose: {
      type: String,
      enum: ["rent", "buy"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "AED",
    },
    size: {
      type: Number,
      min: 0,
    },
    beds: {
      type: Number,
      min: 0,
    },
    baths: {
      type: Number,
      min: 0,
    },
    floor: {
      type: Number,
    },
    furnished: {
      type: String,
      enum: ["unfurnished", "semi-furnished", "furnished"],
      default: "unfurnished",
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
        // [longitude, latitude] — GeoJSON order
        type: [Number],
        required: true,
      },
    },
    address: {
      type: String,
      trim: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "building",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    status: {
      type: String,
      enum: ["draft", "active", "rented", "sold", "expired"],
      default: "draft",
    },
    verifiedAt: {
      type: Date,
    },
    availableFrom: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Geospatial index powering $near / $geoIntersects queries
propertySchema.index({ location: "2dsphere" });
propertySchema.index({ purpose: 1, status: 1, price: 1 });
propertySchema.index({ title: "text", description: "text", address: "text" });

export default mongoose.model("property", propertySchema);
