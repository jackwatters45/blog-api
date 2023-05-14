import express from "express";
import {
	createPost,
	deletePost,
	getPostById,
	getPosts,
	likePost,
	searchPosts,
	unlikePost,
	updatePost,
} from "../controllers/post.controller";

const router = express.Router();

// /posts
router.get("/", getPosts);

// /posts
router.get("/search", searchPosts);

// /posts/:id
router.get("/:id", getPostById);

// /posts/:id
router.post("/", createPost);

// /posts/:id
router.put("/:id", updatePost);

// /posts/:id
router.delete("/:id", deletePost);

// /posts/:id/like
router.post("/:id/like", likePost);

// /posts/:id/unlike
router.post("/:id/unlike", unlikePost);

export default router;
