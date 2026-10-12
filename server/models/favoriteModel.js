import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
      required: true,
    },
  },
  { timestamps: true },
);

// Prevents the same user favouriting a property twice
favoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export default mongoose.model("favorite", favoriteSchema);
