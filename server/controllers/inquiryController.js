import inquiryModel from "../models/inquiryModel.js";
import { errorResponse } from "../utils/errorUtils.js";
import notificationModel from "../models/notificationModel.js";

// GET /inquiries — inquiries addressed to the signed-in agent/landlord
export const getInquiries = async (req, res) => {
  try {
    const filter = { agentId: req.userId };
    if (req.query.status) filter.status = req.query.status;

    const inquiries = await inquiryModel
      .find(filter)
      .populate("propertyId", "title address price currency")
      .populate("userId", "email phone avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, inquiries });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to fetch inquiries");
  }
};

// PATCH /inquiries/:id/status
export const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["new", "contacted", "closed"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const inquiry = await inquiryModel.findOneAndUpdate(
      { _id: req.params.id, agentId: req.userId },
      { $set: { status } },
      { new: true },
    );

    if (!inquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Inquiry not found" });
    }

    await notificationModel.create({
      userId: inquiry.userId,
      type: "inquiry-status",
      payload: { inquiryId: inquiry._id, status },
    });

    res.status(200).json({ success: true, inquiry });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update inquiry" });
  }
};
