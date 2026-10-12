import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
      required: true,
    },
    oldPrice: {
      type: Number,
      required: true,
    },
    newPrice: {
      type: Number,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

priceHistorySchema.index({ propertyId: 1, changedAt: -1 });

export default mongoose.model("priceHistory", priceHistorySchema);
