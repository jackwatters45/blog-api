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
} from "../controllers/user.controller";

const router = express.Router();

router.get("/search", searchUsers);

router.get("/popular", getPopularAuthors);

router.get("/", getUsers);

router.get("/:id", getUserById);

router.post("/", createUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

router.delete("/", deleteUserByQuery);

router.get("/:id/posts", getUserPosts);

export default router;
