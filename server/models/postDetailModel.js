const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define PostDetail Schema
const postDetailSchema = new Schema(
  {
    desc: {
      type: String,
      required: true,
    },
    utilities: {
      type: String,
      required: false, // Optional field
    },
    pet: {
      type: String,
      required: false, // Optional field
    },
    income: {
      type: String,
      required: false, // Optional field
    },
    size: {
      type: Number,
      required: false, // Optional field
    },
    school: {
      type: Number,
      required: false, // Optional field
    },
    bus: {
      type: Number,
      required: false, // Optional field
    },
    restaurant: {
      type: Number,
      required: false, // Optional field
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post", // Reference to the Post model
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post", // Reference to the Post model
      required: true,
      unique: true,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Create the model
export default mongoose.model("postDetail", postDetailSchema);
