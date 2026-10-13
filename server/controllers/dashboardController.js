import mongoose from "mongoose";
import propertyModel from "../models/propertyModel.js";
import propertyMediaModel from "../models/propertyMediaModel.js";
import priceHistoryModel from "../models/priceHistoryModel.js";
import inquiryModel from "../models/inquiryModel.js";
import favoriteModel from "../models/favoriteModel.js";
import savedSearchModel from "../models/savedSearchModel.js";
import conversationModel from "../models/conversationModel.js";
import messageModel from "../models/messageModel.js";
import reviewModel from "../models/reviewModel.js";
import notificationModel from "../models/notificationModel.js";
import agencyModel from "../models/agencyModel.js";
import areaModel from "../models/areaModel.js";
import buildingModel from "../models/buildingModel.js";
import userModel from "../models/userModel.js";
import { errorResponse } from "../utils/errorUtils.js";

// Reusable date filter for "within the last N days"
const since = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// req.userId arrives as a string from the JWT payload. Mongoose casts ids for
// find()/countDocuments(), but NOT inside aggregate(), so every $match against
// a user id must be cast explicitly or it silently matches nothing.
const asObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

/* ------------------------------------------------------------------ */
/* Buyer / renter                                                      */
/* ------------------------------------------------------------------ */

// GET /dashboard/buyer
export const getBuyerDashboard = async (req, res) => {
  try {
    const userId = req.userId;
    const userObjectId = asObjectId(userId);

    const [
      favoriteCount,
      savedSearchCount,
      inquiryCount,
      conversationCount,
      unreadNotifications,
      recentFavorites,
      recentInquiries,
    ] = await Promise.all([
      favoriteModel.countDocuments({ userId }),
      savedSearchModel.countDocuments({ userId }),
      inquiryModel.countDocuments({ userId }),
      conversationModel.countDocuments({ participants: userId }),
      notificationModel.countDocuments({ userId, readAt: null }),
      favoriteModel
        .find({ userId })
        .populate({
          path: "propertyId",
          select:
            "title price currency type purpose beds address status location",
        })
        .sort({ createdAt: -1 })
        .limit(10),
      inquiryModel
        .find({ userId })
        .populate("propertyId", "title address price currency")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // Spend exposure across favorited listings, grouped by purpose
    const budget = await propertyModel.aggregate([
      {
        $match: {
          _id: {
            $in: recentFavorites.map((f) => f.propertyId?._id).filter(Boolean),
          },
        },
      },
      {
        $group: {
          _id: "$purpose",
          count: { $sum: 1 },
          totalValue: { $sum: "$price" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      role: req.userRole,
      summary: {
        favorites: favoriteCount,
        savedSearches: savedSearchCount,
        inquiriesSent: inquiryCount,
        conversations: conversationCount,
        unreadNotifications,
      },
      favoriteSummary: budget.reduce((acc, row) => {
        acc[row._id] = {
          count: row.count,
          totalValue: row.totalValue,
          avgPrice: row.avgPrice,
          minPrice: row.minPrice,
          maxPrice: row.maxPrice,
        };
        return acc;
      }, {}),
      recentFavorites,
      recentInquiries,
    });
  } catch (error) {
    errorResponse(res, error, "Failed to build buyer dashboard");
  }
};

/* ------------------------------------------------------------------ */
/* Agent / landlord                                                    */
/* ------------------------------------------------------------------ */

// GET /dashboard/agent
export const getAgentDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    // Listings the user owns, plus any they are assigned as agent
    const userObjectId = asObjectId(req.userId);
    const ownership = {
      $or: [{ ownerId: userObjectId }, { agentId: userObjectId }],
    };

    // Fetch the matching ids once and reuse them for the media and
    // price-history counts, instead of re-running the same query three times.
    const ownedIds = (
      await propertyModel.find(ownership).select("_id").lean()
    ).map((p) => p._id);

    const [
      totalListings,
      byStatus,
      byPurpose,
      priceStats,
      inquiries,
      inquiryByStatus,
      mediaCount,
      recentListings,
      recentInquiries,
      priceChanges,
    ] = await Promise.all([
      propertyModel.countDocuments(ownership),
      propertyModel.aggregate([
        { $match: ownership },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      propertyModel.aggregate([
        { $match: ownership },
        {
          $group: {
            _id: "$purpose",
            count: { $sum: 1 },
            avgPrice: { $avg: "$price" },
            totalValue: { $sum: "$price" },
          },
        },
      ]),
      propertyModel.aggregate([
        { $match: ownership },
        {
          $group: {
            _id: null,
            totalPortfolioValue: { $sum: "$price" },
            avgPrice: { $avg: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]),
      inquiryModel.countDocuments({ agentId: userId }),
      inquiryModel.aggregate([
        { $match: { agentId: userObjectId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      propertyMediaModel.countDocuments({ propertyId: { $in: ownedIds } }),
      propertyModel.find(ownership).sort({ createdAt: -1 }).limit(10),
      inquiryModel
        .find({ agentId: userId })
        .populate("propertyId", "title address price currency")
        .populate("userId", "email phone avatar")
        .sort({ createdAt: -1 })
        .limit(10),
      priceHistoryModel
        .find({
          propertyId: { $in: ownedIds },
          changedAt: { $gte: since(30) },
        })
        .sort({ changedAt: -1 })
        .limit(10),
    ]);

    const toObject = (rows) =>
      rows.reduce((acc, row) => {
        acc[row._id] = row.count;
        return acc;
      }, {});

    const stats = priceStats[0] || {};

    // Only listings that are still on the market count as live value
    const liveValue =
      (
        await propertyModel.aggregate([
          { $match: { ...ownership, status: "active" } },
          { $group: { _id: null, value: { $sum: "$price" } } },
        ])
      )[0]?.value || 0;

    res.status(200).json({
      success: true,
      role: req.userRole,
      summary: {
        totalListings,
        activeListings: toObject(byStatus).active || 0,
        totalInquiries: inquiries,
        newInquiries: toObject(inquiryByStatus).new || 0,
        mediaAssets: mediaCount,
        portfolioValue: stats.totalPortfolioValue || 0,
        avgPrice: stats.avgPrice || 0,
        priceRange: { min: stats.minPrice || 0, max: stats.maxPrice || 0 },
        livePortfolioValue: liveValue,
      },
      listingsByStatus: toObject(byStatus),
      listingsByPurpose: byPurpose.reduce((acc, row) => {
        acc[row._id] = {
          count: row.count,
          avgPrice: row.avgPrice,
          totalValue: row.totalValue,
        };
        return acc;
      }, {}),
      inquiriesByStatus: toObject(inquiryByStatus),
      recentListings,
      recentInquiries,
      recentPriceChanges: priceChanges,
    });
  } catch (error) {
    errorResponse(res, error, "Failed to build agent dashboard");
  }
};

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

// GET /dashboard/admin
export const getAdminDashboard = async (req, res) => {
  try {
    const [
      usersByRole,
      verifiedUsers,
      unverifiedUsers,
      agenciesByVerification,
      propertiesByStatus,
      unverifiedProperties,
      totalProperties,
      totalAgencies,
      totalAreas,
      totalBuildings,
      inquiriesByStatus,
      reviewsCount,
      totalMessages,
      recentUsers,
      recentProperties,
      reviewBreakdown,
    ] = await Promise.all([
      userModel.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      userModel.countDocuments({ verified: true }),
      userModel.countDocuments({ verified: false }),
      agencyModel.aggregate([
        { $group: { _id: "$verified", count: { $sum: 1 } } },
      ]),
      propertyModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      propertyModel.countDocuments({ verifiedAt: null }),
      propertyModel.countDocuments(),
      agencyModel.countDocuments(),
      areaModel.countDocuments(),
      buildingModel.countDocuments(),
      inquiryModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      reviewModel.countDocuments(),
      messageModel.countDocuments(),
      userModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("email phone role verified createdAt"),
      propertyModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title price currency status verifiedAt createdAt"),
      reviewModel.aggregate([
        { $group: { _id: "$targetType", count: { $sum: 1 } } },
      ]),
    ]);

    const toObject = (rows) =>
      rows.reduce((acc, row) => {
        acc[String(row._id)] = row.count;
        return acc;
      }, {});

    // Verified vs unverified listings, both directions, for the admin queue
    const [
      verifiedProperties,
      pendingProperties,
      verifiedAgencies,
      pendingAgencies,
    ] = await Promise.all([
      propertyModel
        .find({ verifiedAt: { $ne: null } })
        .sort({ verifiedAt: -1 })
        .limit(20)
        .select("title price currency status verifiedAt"),
      propertyModel
        .find({ verifiedAt: null })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("title price currency status createdAt"),
      agencyModel.find({ verified: true }).limit(20),
      agencyModel.find({ verified: false }).sort({ createdAt: -1 }).limit(20),
    ]);

    const totalRevenue = await propertyModel.aggregate([
      { $match: { status: { $in: ["rented", "sold"] } } },
      { $group: { _id: null, value: { $sum: "$price" }, count: { $sum: 1 } } },
    ]);

    const usersByRoleObj = toObject(usersByRole);
    const propertiesByStatusObj = toObject(propertiesByStatus);

    res.status(200).json({
      success: true,
      role: "admin",
      summary: {
        totalUsers: Object.values(usersByRoleObj).reduce((a, b) => a + b, 0),
        usersByRole: usersByRoleObj,
        verifiedUsers,
        unverifiedUsers,
        totalProperties,
        propertiesByStatus: propertiesByStatusObj,
        verifiedProperties: totalProperties - unverifiedProperties,
        unverifiedProperties,
        totalAgencies,
        verifiedAgencies:
          agenciesByVerification.find((r) => r._id === true)?.count || 0,
        unverifiedAgencies:
          agenciesByVerification.find((r) => r._id === false)?.count || 0,
        totalAreas,
        totalBuildings,
        totalReviews: reviewsCount,
        reviewsByTarget: toObject(reviewBreakdown),
        totalMessages,
        inquiriesByStatus: toObject(inquiriesByStatus),
        closedDeals: totalRevenue[0]?.count || 0,
        closedDealValue: totalRevenue[0]?.value || 0,
      },
      verified: {
        users: {
          count: verifiedUsers,
          sample: recentUsers.filter((u) => u.verified),
        },
        properties: {
          count: totalProperties - unverifiedProperties,
          sample: verifiedProperties,
        },
        agencies: {
          count: agenciesByVerification.find((r) => r._id === true)?.count || 0,
          sample: verifiedAgencies,
        },
      },
      unverified: {
        users: {
          count: unverifiedUsers,
          sample: recentUsers.filter((u) => !u.verified),
        },
        properties: { count: unverifiedProperties, sample: pendingProperties },
        agencies: {
          count:
            agenciesByVerification.find((r) => r._id === false)?.count || 0,
          sample: pendingAgencies,
        },
      },
      recentUsers,
      recentProperties,
    });
  } catch (error) {
    errorResponse(res, error, "Failed to build admin dashboard");
  }
};

/* ------------------------------------------------------------------ */
/* Verification actions                                                */
/* ------------------------------------------------------------------ */

// PATCH /dashboard/admin/users/:userId/verify
export const setUserVerification = async (req, res) => {
  try {
    const { verified } = req.body;

    if (typeof verified !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "verified must be a boolean" });
    }

    const user = await userModel.findByIdAndUpdate(
      req.params.userId,
      { $set: { verified } },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    errorResponse(res, error, "Failed to update user verification");
  }
};

// PATCH /dashboard/admin/properties/:propertyId/verify
export const setPropertyVerification = async (req, res) => {
  try {
    const { verified } = req.body;

    if (typeof verified !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "verified must be a boolean" });
    }

    const property = await propertyModel.findById(req.params.propertyId);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    property.verifiedAt = verified ? new Date() : null;
    await property.save();

    res.status(200).json({ success: true, property });
  } catch (error) {
    errorResponse(res, error, "Failed to update property verification");
  }
};

// PATCH /dashboard/admin/agencies/:agencyId/verify
export const setAgencyVerification = async (req, res) => {
  try {
    const { verified } = req.body;

    if (typeof verified !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "verified must be a boolean" });
    }

    const agency = await agencyModel.findByIdAndUpdate(
      req.params.agencyId,
      { $set: { verified } },
      { new: true },
    );

    if (!agency) {
      return res
        .status(404)
        .json({ success: false, message: "Agency not found" });
    }

    res.status(200).json({ success: true, agency });
  } catch (error) {
    errorResponse(res, error, "Failed to update agency verification");
  }
};
