import express from "express";
import {
	createComment,
	deleteComment,
	getCommentById,
	getComments,
	updateComment,
} from "../controllers/comment.controller";

const router = express.Router();

// /comments
router.get("/", getComments);

// /comments/:id
router.get("/:id", getCommentById);

// /comments
router.post("/", createComment);

// /comments/:id
router.put("/:id", updateComment);

// /comments/:id
router.delete("/:id", deleteComment);

export default router;
