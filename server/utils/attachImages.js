import propertyMediaModel from "../models/propertyMediaModel.js";

/**
 * Attaches an `images` array of urls (plus a `thumbnail`) to a page of
 * properties, using a single query for the whole page.
 *
 * Media lives in its own collection, so any endpoint that returns properties as
 * a list needs this or the cards have nothing to show. Spread into a plain
 * object — assigning `images` onto the document would be dropped by Mongoose's
 * strict mode since it is not a schema path.
 */
export const attachImages = async (properties) => {
  if (!properties.length) return properties;

  const media = await propertyMediaModel
    .find({
      propertyId: { $in: properties.map((property) => property._id) },
      type: "image",
    })
    .sort({ order: 1 })
    .select("propertyId url blurhash");

  const grouped = media.reduce((acc, item) => {
    const key = item.propertyId.toString();
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return properties.map((property) => {
    const document =
      typeof property?.toObject === "function" ? property.toObject() : property;
    const images = grouped[property._id.toString()] || [];
    return {
      ...document,
      images: images.map((image) => image.url),
      thumbnail: images[0]?.url || null,
    };
  });
};
