import express from "express";
import {
	createTopic,
	getPostsByTopic,
	getTopics,
	deleteTopic,
	updateTopic,
} from "../controllers/topic.controller";
const router = express.Router();

// /topics
router.get("/", getTopics);

// /topics/:id
router.get("/:id", getPostsByTopic);

// /topics
router.post("/", createTopic);

// /topics/:id
router.patch("/:id", updateTopic);

// /topics/:id
router.delete("/:id", deleteTopic);

export default router;
