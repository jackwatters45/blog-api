import express from "express";
import {
	createComment,
	createCommentReply,
	deleteComment,
	dislikeComment,
	getCommentById,
	getComments,
	getReplies,
	likeComment,
	updateComment,
} from "../controllers/comment.controller";

const router = express.Router({ mergeParams: true });

// posts/:post/comments
router.get("/", getComments);

// posts/:post/comments/:id
router.get("/:id", getCommentById);

// posts/:post/comments
router.post("/", createComment);

// posts/:post/comments/:id
router.put("/:id", updateComment);

// posts/:post/comments/:id
router.delete("/:id", deleteComment);

// posts/:post/comments/:id/like
router.post("/:id/like", likeComment);

// posts/:post/comments/:id/dislike
router.post("/:id/dislike", dislikeComment);

// posts/:post/comments/:id/reply
router.post("/:id/reply", createCommentReply);

// posts/:post/comments/:id/replies
router.get("/:id/replies", getReplies);

export default router;
