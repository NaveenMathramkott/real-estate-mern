import propertyModel from "../models/propertyModel.js";
import areaModel from "../models/areaModel.js";
import { cache } from "../config/redis.js";

// Lightweight autocomplete over listing titles, addresses and project names
export const suggest = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.status(400).json({ success: false, message: "q is required" });
    }

    const properties = await propertyModel
      .find(
        { status: "active", address: new RegExp(q, "i") },
        {
          title: 1,
          address: 1,
          price: 1,
          currency: 1,
          "location.coordinates": 1,
        },
      )
      .limit(8);

    const areas = await areaModel
      .find(
        { $or: [{ name: new RegExp(q, "i") }, { city: new RegExp(q, "i") }] },
        { name: 1, city: 1 },
      )
      .limit(5);

    const suggestions = [
      ...areas.map((area) => ({
        type: "area",
        label: `${area.name}, ${area.city}`,
        areaId: area._id,
      })),
      ...properties.map((property) => ({
        type: "property",
        label: property.title,
        address: property.address,
        price: property.price,
        currency: property.currency,
        coordinates: property.location.coordinates,
        propertyId: property._id,
      })),
    ];

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch suggestions" });
  }
};

// Draw-area search: counts and summarises listings inside a drawn polygon
export const searchPolygon = async (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      return res.status(400).json({
        success: false,
        message: "coordinates must contain at least 3 [lng,lat] points",
      });
    }

    const cacheKey = `search:polygon:${JSON.stringify(coordinates)}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...JSON.parse(cached), cached: true });
    }

    const geoFilter = {
      status: "active",
      location: {
        $geoIntersects: {
          $geometry: { type: "Polygon", coordinates: [coordinates] },
        },
      },
    };

    const [properties, total, priceAgg] = await Promise.all([
      propertyModel
        .find(geoFilter)
        .select("title price currency type purpose beds address location")
        .limit(500),
      propertyModel.countDocuments(geoFilter),
      propertyModel.aggregate([
        { $match: geoFilter },
        {
          $group: {
            _id: null,
            avgPrice: { $avg: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]),
    ]);

    const stats = priceAgg[0] || {};

    const payload = {
      success: true,
      total,
      stats: {
        avgPrice: stats.avgPrice || 0,
        minPrice: stats.minPrice || 0,
        maxPrice: stats.maxPrice || 0,
      },
      properties,
    };

    await cache.set(cacheKey, JSON.stringify(payload), 120);

    res.status(200).json(payload);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message || "Polygon search failed",
    });
  }
};

// Estimates straight-line commute reach for an origin within a time budget.
// Results are cached in Redis to warm repeated isochrone lookups.
export const searchCommute = async (req, res) => {
  try {
    const { lat, lng, minutes = 30, speedKph = 30 } = req.body;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ success: false, message: "lat and lng are required" });
    }

    const timeBudget = Math.max(Number(minutes), 1);
    const radiusMetres = (timeBudget / 60) * Number(speedKph) * 1000;

    const cacheKey = `search:commute:${lat},${lng},${timeBudget},${speedKph}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...JSON.parse(cached), cached: true });
    }

    const geoFilter = {
      status: "active",
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: radiusMetres,
        },
      },
    };

    const [properties, total] = await Promise.all([
      propertyModel
        .find(geoFilter)
        .select("title price currency address location")
        .limit(500),
      // $near cannot be used in aggregation context, so count with $geoWithin
      propertyModel.countDocuments({
        status: "active",
        location: {
          $geoWithin: {
            $centerSphere: [[Number(lng), Number(lat)], radiusMetres / 6378100],
          },
        },
      }),
    ]);

    const payload = {
      success: true,
      origin: { lat: Number(lat), lng: Number(lng) },
      minutes: timeBudget,
      radiusMetres: Math.round(radiusMetres),
      total,
      properties,
    };

    await cache.set(cacheKey, JSON.stringify(payload), 300);

    res.status(200).json(payload);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message || "Commute search failed",
    });
  }
};
