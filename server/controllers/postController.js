import postModel from "../models/postModel.js";
import savedPostModel from "../models/savedPostModel.js";
import jwt from "jsonwebtoken";

// Get post controller

export const getPosts = async (req, res) => {
  const query = req.query;

  const filters = {
    city: query.city || undefined,
    type: query.type || undefined,
    property: query.property || undefined,
    bedroom: parseInt(query.bedroom) || undefined,
    price: query.minPrice &&
      query.maxPrice && {
        $gte: parseInt(query.minPrice),
        $lte: parseInt(query.maxPrice),
      },
  };
  // filtering undefined quries from filter
  Object.keys(filters).forEach(
    (key) => filters[key] === undefined && delete filters[key]
  );

  try {
    const posts = await postModel.find(filters);

    res.status(200).send(posts);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to get posts" });
  }
};

// Get Single post by ID

export const getPostById = async (req, res) => {
  const id = req.params.id;

  try {
    const post = await postModel.findById(id);

    const token = req.cookies?.token;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (!err) {
          const saved = await savedPostModel.find({
            postId: id,
            userId: payload.id,
          });
          res.status(200).send({ post, isSaved: saved ? true : false });
        }
      });
    }
    res.status(200).send({ post, isSaved: false });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to get post" });
  }
};

// Create new post

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const post = await new postModel({
      ...body.postData,
      userId: tokenUserId,
      postDetail: {
        create: body.postDetail,
      },
    }).save();

    res.status(200).send({ post, message: "New post create successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to create post" });
  }
};

// Update a existing posts

export const updatePost = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  try {
    const post = await postModel.findByIdAndUpdate(id, body);

    res.status(200).send({ post, message: "post updated" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to update posts" });
  }
};

// delete post by ID

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  try {
    const post = await postModel.findById(id);

    if (post.userId.toString() !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }
    console.log(id, tokenUserId, post.userId.toString());

    await postModel.findByIdAndDelete(id);

    res.status(200).send({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to delete post" });
  }
};
