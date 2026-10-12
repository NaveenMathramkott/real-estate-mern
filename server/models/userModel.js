import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["buyer", "renter", "agent", "landlord", "admin"],
      default: "buyer",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    locale: {
      type: String,
      default: "en",
    },
    currency: {
      type: String,
      default: "INR",
    },
    passwordHash: {
      type: String,
      required: true,
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("user", userSchema);
