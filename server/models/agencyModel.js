import mongoose from "mongoose";

const agencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
    },
    licenseNo: {
      type: String,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("agency", agencySchema);
