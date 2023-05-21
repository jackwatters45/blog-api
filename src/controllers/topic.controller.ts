/* eslint-disable @typescript-eslint/no-explicit-any */
import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import passport from "passport";
import { IUser } from "../models/user.model";
import Topic from "../models/topic.model";
import Post from "../models/post.model";

// @desc    Get all topics
// @route   GET /topics
// @access  Public
export const getTopics = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const topics = await Topic.find();
			res.status(201).json(topics);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get posts by topic
// @route   GET /topics/:id
// @access  Public
export const getPostsByTopic = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const posts = await Post.find({
				name: req.params.id,
				published: true,
			}).populate("author", "firstName lastName");
			res.status(201).json(posts);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create topic
// @route   POST /topics
// @access  Private
export const createTopic = [
	passport.authenticate("jwt", { session: false }),
	body("name")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Topic name must be at least 1 character long"),

	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const user = req.user as IUser;

		if (!user) return res.status(401).json({ message: "Unauthorized" });

		try {
			const { name } = req.body;
			const topic = new Topic({
				name,
			});

			const newTopic = await topic.save();
			res.status(201).json(newTopic);
		} catch (error) {
			res.status(400).json({ message: error.message });
		}
	}),
];

// @desc    Update topic
// @route   PATCH /topics/:id
// @access  Private
export const updateTopic = [
	passport.authenticate("jwt", { session: false }),
	body("name")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Topic name must be at least 1 character long"),

	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		try {
			const { name } = req.body;
			const topic = await Topic.findByIdAndUpdate(
				req.params.id,
				{ name },
				{ new: true },
			);

			res.status(201).json(topic);
		} catch (error) {
			res.status(400).json({ message: error.message });
		}
	}),
];

// @desc    Delete topic
// @route   DELETE /topics/:id
// @access  Private
export const deleteTopic = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		try {
			const topic = await Topic.findByIdAndDelete(req.params.id);

			if (!topic) return res.status(404).json({ message: "Topic not found" });

			res.status(201).json(topic);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];
