import express from "express";
import {
	createPost,
	deletePost,
	getLikes,
	getPopularPosts,
	getPostById,
	getPosts,
	likePost,
	searchPosts,
	unlikePost,
	updatePost,
} from "../controllers/post.controller";
import { getCommentsByPostId } from "../controllers/comment.controller";

const router = express.Router();

// /posts
router.get("/", getPosts);

// /posts/:id
router.post("/", createPost);

// /posts
router.get("/search", searchPosts);

// /posts/popular
router.get("/popular", getPopularPosts);

// /posts/:id
router.get("/:id", getPostById);

// /posts/:id
router.put("/:id", updatePost);

// /posts/:id
router.delete("/:id", deletePost);

// /posts/:id/like
router.get("/:id/likes", getLikes);

// /posts/:id/like
router.put("/:id/like", likePost);

// /posts/:id/unlike
router.put("/:id/unlike", unlikePost);

// /posts/:id/comments
router.use("/:id/comments", getCommentsByPostId);

export default router;
