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
      type: mongoose.ObjectId,
      ref: "type",
    },
    property: {
      type: mongoose.ObjectId,
      ref: "property",
    },
    user: {
      type: mongoose.ObjectId,
      ref: "user",
    },
    postDetails: {
      type: mongoose.ObjectId,
      ref: "postDetail",
    },
    savedPosts: {
      type: mongoose.ObjectId,
      ref: "savedPost",
    },
  },
  { timestamps: true }
);

export default mongoose.model("post", postSchema);
