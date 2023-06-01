import express from "express";
import {
	createUser,
	deleteUser,
	deleteUserByQuery,
	getUserById,
	getUsers,
	searchUsers,
	updateUser,
	getUserPosts,
	getPopularAuthors,
	addFollower,
	removeFollower,
	getUsersPreviewData,
} from "../controllers/user.controller";

const router = express.Router();

// /users
router.get("/search", searchUsers);

// /users/popular
router.get("/popular", getPopularAuthors);

// /users/preview
router.get("/preview", getUsersPreviewData);

// /users/:id/follow
router.put("/:id/follow", addFollower);

// /users/:id/unfollow
router.put("/:id/unfollow", removeFollower);

// /users/:id/posts
router.get("/:id/posts", getUserPosts);

// /users
router.get("/", getUsers);

// /users/:id
router.get("/:id", getUserById);

// /users
router.post("/", createUser);

// /users/:id
router.patch("/:id", updateUser);

// /users/:id
router.delete("/:id", deleteUser);

// /users
router.delete("/", deleteUserByQuery);

export default router;
