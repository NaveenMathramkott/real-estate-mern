import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: {
      type: [String],
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    bedroom: {
      type: Number,
      required: true,
    },
    bathroom: {
      type: Number,
      required: true,
    },
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.ObjectId,
      required: true,
    },
    type: {
      type: String,
      default: "buy",
      enum: ["buy", "rent"],
    },
    property: {
      type: String,
      default: "apartment",
      renum: ["apartment", "house", "land", "condo"],
    },
    user: {
      type: mongoose.ObjectId,
      ref: "user",
    },
    description: {
      type: String,
    },
    utilities: {
      type: String,
    },
    pet: {
      type: String,
    },
    income: {
      type: String,
    },
    size: {
      type: Number,
    },
    school: {
      type: Number,
    },
    bus: {
      type: Number,
    },
    restaurant: {
      type: Number,
    },
    savedPosts: {
      type: mongoose.ObjectId,
      ref: "savedPost",
    },
  },
  { timestamps: true }
);

export default mongoose.model("post", postSchema);
