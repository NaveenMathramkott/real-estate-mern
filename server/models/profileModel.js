import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "agency",
    },
    bio: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("profile", profileSchema);
