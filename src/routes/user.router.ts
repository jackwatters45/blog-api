import express from "express";
import {
	createUser,
	deleteUser,
	deleteUserByQuery,
	getUserById,
	getUsers,
	searchUsers,
	updateUser,
} from "../controllers/user.controller";

const router = express.Router();

router.get("/search", searchUsers);

router.get("/", getUsers);

router.get("/:id", getUserById);

router.post("/", createUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

router.delete("/", deleteUserByQuery);

// add posts and comments to users (eventually update populate db)

export default router;
