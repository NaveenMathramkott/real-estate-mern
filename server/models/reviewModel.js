import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["building", "area", "agent"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    body: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true },
);

// One review per user per target
reviewSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

export default mongoose.model("review", reviewSchema);
