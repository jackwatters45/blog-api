import express from "express";
import {
	createUser,
	deleteUser,
	getUserById,
	getUsers,
	updateUser,
	getUserPosts,
	getPopularAuthors,
	addFollower,
	removeFollower,
	getUsersPreviewData,
	getDeletedUserById,
	getUserFollowing,
	updateUserPassword,
	getSavedPosts,
} from "../controllers/user.controller";

const router = express.Router();

// /users/popular
router.get("/popular", getPopularAuthors);

// /users/preview
router.get("/preview", getUsersPreviewData);

// /users/:id/saved-posts
router.get("/:id/saved-posts", getSavedPosts);

// /users/:id/follow
router.put("/:id/follow", addFollower);

// /users/:id/unfollow
router.put("/:id/unfollow", removeFollower);

// /users/:id/posts
router.get("/:id/posts", getUserPosts);

// /users/:id/deleted
router.get("/:id/deleted", getDeletedUserById);

// /users/:id/followers
router.get("/:id/following", getUserFollowing);

// /users/:id/password
router.put("/:id/password", updateUserPassword);

// /users
router.get("/", getUsers);

// /users/:id
router.get("/:id", getUserById);

// /users
router.post("/", createUser);

// /users/:id/delete
router.patch("/:id/delete", deleteUser);

// /users/:id
router.patch("/:id", updateUser);

export default router;
