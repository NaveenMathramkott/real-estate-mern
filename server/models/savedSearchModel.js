import mongoose from "mongoose";

const savedSearchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    alertFrequency: {
      type: String,
      enum: ["off", "daily", "weekly", "instant"],
      default: "daily",
    },
    lastRunAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

savedSearchSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("savedSearch", savedSearchSchema);
