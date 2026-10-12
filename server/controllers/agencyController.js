import agencyModel from "../models/agencyModel.js";
import profileModel from "../models/profileModel.js";
import userModel from "../models/userModel.js";
import { errorResponse } from "../utils/errorUtils.js";

// GET /agencies
export const getAgencies = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.verified) filter.verified = req.query.verified === "true";

    const [agencies, total] = await Promise.all([
      agencyModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      agencyModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      agencies,
    });
  } catch (error) {
    errorResponse(res, error, "Failed to fetch agencies");
  }
};

// GET /agencies/:id
export const getAgencyById = async (req, res) => {
  try {
    const agency = await agencyModel.findById(req.params.id);

    if (!agency) {
      return res
        .status(404)
        .json({ success: false, message: "Agency not found" });
    }

    const members = await profileModel
      .find({ agencyId: agency._id })
      .select("name avatar userId");

    res.status(200).json({ success: true, agency, members });
  } catch (error) {
    errorResponse(res, error, "Failed to fetch agency");
  }
};

// POST /agencies
export const addAgency = async (req, res) => {
  try {
    const { name, logo, licenseNo, verified } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "name is required" });
    }

    const agency = await agencyModel.create({
      name,
      logo,
      licenseNo,
      verified,
    });

    res.status(201).json({ success: true, agency });
  } catch (error) {
    errorResponse(res, error, "Failed to create agency");
  }
};

// PATCH /agencies/:id
export const updateAgency = async (req, res) => {
  try {
    const agency = await agencyModel.findById(req.params.id);

    if (!agency) {
      return res
        .status(404)
        .json({ success: false, message: "Agency not found" });
    }

    const { name, logo, licenseNo, verified } = req.body;

    if (name !== undefined) agency.name = name;
    if (logo !== undefined) agency.logo = logo;
    if (licenseNo !== undefined) agency.licenseNo = licenseNo;
    // Only an admin may flip the verified flag
    if (verified !== undefined && req.userRole === "admin")
      agency.verified = verified;

    await agency.save();

    res.status(200).json({ success: true, agency });
  } catch (error) {
    errorResponse(res, error, "Failed to update agency");
  }
};

// DELETE /agencies/:id
export const deleteAgency = async (req, res) => {
  try {
    const agency = await agencyModel.findById(req.params.id);

    if (!agency) {
      return res
        .status(404)
        .json({ success: false, message: "Agency not found" });
    }

    const memberCount = await profileModel.countDocuments({
      agencyId: agency._id,
    });

    if (memberCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete: ${memberCount} profile${
          memberCount === 1 ? "" : "s"
        } still reference this agency`,
      });
    }

    await agencyModel.deleteOne({ _id: agency._id });

    res.status(200).json({ success: true, message: "Agency deleted" });
  } catch (error) {
    errorResponse(res, error, "Failed to delete agency");
  }
};

// GET /profiles/me
export const getMyProfile = async (req, res) => {
  try {
    const profile = await profileModel
      .findOne({ userId: req.userId })
      .populate("agencyId", "name logo verified");

    res.status(200).json({ success: true, profile });
  } catch (error) {
    errorResponse(res, error, "Failed to fetch profile");
  }
};

// PATCH /profiles/me — upserts, since registration only creates a profile when a name is given
export const updateMyProfile = async (req, res) => {
  try {
    const { name, avatar, agencyId, bio } = req.body;

    const profile = await profileModel.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          ...(name !== undefined && { name }),
          ...(avatar !== undefined && { avatar }),
          ...(agencyId !== undefined && { agencyId }),
          ...(bio !== undefined && { bio }),
        },
        $setOnInsert: { userId: req.userId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({ success: true, profile });
  } catch (error) {
    errorResponse(res, error, "Failed to update profile");
  }
};

// GET /profiles/:userId
export const getProfileByUser = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.userId)
      .select("email phone role verified locale currency createdAt");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const profile = await profileModel.findOne({ userId: user._id });

    res.status(200).json({ success: true, user, profile });
  } catch (error) {
    errorResponse(res, error, "Failed to fetch profile");
  }
};

// PATCH /users/me — locale and currency preferences
export const updateMyPreferences = async (req, res) => {
  try {
    const { locale, currency } = req.body;

    const user = await userModel.findById(req.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (locale !== undefined) user.locale = locale;
    if (currency !== undefined) user.currency = currency;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        locale: user.locale,
        currency: user.currency,
      },
    });
  } catch (error) {
    errorResponse(res, error, "Failed to update preferences");
  }
};
