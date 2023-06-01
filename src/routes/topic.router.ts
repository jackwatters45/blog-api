import express from "express";
import {
	createTopic,
	getPostsByTopic,
	getTopics,
	deleteTopic,
	updateTopic,
	getPopularTopics,
	getTopicById,
} from "../controllers/topic.controller";
const router = express.Router();

// /topics
router.get("/", getTopics);

// /topics/popular
router.get("/popular", getPopularTopics);

// /topics/:id/posts
router.get("/:id/posts", getPostsByTopic);

// /topics/:id/
router.get("/:id", getTopicById);

// /topics
router.post("/", createTopic);

// /topics/:id
router.patch("/:id", updateTopic);

// /topics/:id
router.delete("/:id", deleteTopic);

export default router;
