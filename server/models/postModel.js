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
      type: [String], // Array of strings
      required: true,
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
    type: {
      type: String, // Replace with actual Type enum if needed
      required: true,
    },
    property: {
      type: String, // Replace with actual Property enum if needed
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Reference to the User model
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Reference to the User model
      required: true,
    },
    postDetail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postDetail", // Reference to the PostDetail model
      required: false, // Optional, can be null
    },
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "savedPost", // Reference to the SavedPost model
      },
    ],
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

export default mongoose.model("post", postSchema);
