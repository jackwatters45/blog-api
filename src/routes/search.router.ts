import express from "express";
import {
	searchAll,
	searchMyPosts,
	searchPosts,
	searchTopics,
	searchUsers,
	searchUsersAdmin,
} from "../controllers/search.controller";

const router = express.Router();

// search/all
router.get("/all", searchAll);

// /search/posts
router.get("/posts", searchPosts);

// /search/users
router.get("/users", searchUsers);

// /search/admin/users
router.get("/admin/users", searchUsersAdmin);

// /search/my-posts
router.get("/my-posts", searchMyPosts);

// /search/topics
router.get("/topics", searchTopics);

export default router;
