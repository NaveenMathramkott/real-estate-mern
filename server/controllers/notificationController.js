import notificationModel from "../models/notificationModel.js";

// GET /notifications
export const getNotifications = async (req, res) => {
  try {
    const filter = { userId: req.userId };
    if (req.query.unreadOnly === "true") filter.readAt = null;

    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const notifications = await notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
};

// PATCH /notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await notificationModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { readAt: new Date() } },
      { new: true },
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update notification" });
  }
};

// PATCH /notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await notificationModel.updateMany(
      { userId: req.userId, readAt: null },
      { $set: { readAt: new Date() } },
    );

    res.status(200).json({ success: true, updated: result.modifiedCount });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update notifications" });
  }
};
