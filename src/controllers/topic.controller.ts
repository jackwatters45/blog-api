import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import passport from "passport";
import { IUser } from "../models/user.model";
import Topic from "../models/topic.model";
import Post from "../models/post.model";
import { Types } from "mongoose";
import { calculateStartTime } from "./utils";

// @desc    Get all topics
// @route   GET /topics
// @access  Public
export const getTopics = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const topicsQuery = Topic.find();

			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				topicsQuery.limit(limit);
			}

			const topics = await topicsQuery.exec();
			res.status(201).json(topics);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get topic by id
// @route   GET /topics/:id
// @access  Public
export const getTopicById = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const topic = await Topic.findById(req.params.id);
			res.status(201).json(topic);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get posts by topic with aggregate
// @route   GET /topics/:id/posts
// @access  Public
export const getPostsByTopic = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			let limit = 100; // default limit
			if (req.query.limit) {
				limit = parseInt(req.query.limit as string);
			}

			const start = calculateStartTime(req.query.timeRange as string);

			const topic = await Topic.findById(req.params.id);

			const total = await Post.countDocuments({
				topic: new Types.ObjectId(req.params.id),
				published: true,
			});

			let postsQuery = Post.aggregate([
				{
					$match: {
						topic: new Types.ObjectId(req.params.id),
						published: true,
					},
				},
				{
					$addFields: {
						numberOfLikesFiltered: {
							$filter: {
								input: "$likes",
								as: "like",
								cond: { $gte: ["$$like.date", start] },
							},
						},
					},
				},
				{
					$sort: { numberOfLikesFiltered: -1, createdAt: -1 },
				},
				{
					$limit: limit,
				},
				{
					$lookup: {
						from: "users",
						localField: "author",
						foreignField: "_id",
						as: "author",
					},
				},
				{
					$unwind: {
						path: "$author",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$project: {
						_id: 1,
						createdAt: 1,
						likes: 1,
						comments: 1,
						tags: 1,
						content: 1,
						title: 1,
						author: {
							_id: "$author._id",
							firstName: "$author.firstName",
							lastName: "$author.lastName",
						},
					},
				},
			]);

			if (req.query.offset) {
				const offset = parseInt(req.query.offset as string);
				postsQuery = postsQuery.skip(offset);
			}

			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				postsQuery = postsQuery.limit(limit);
			}

			const posts = await postsQuery.exec();

			res.status(201).json({ posts, topic, meta: { total } });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create topic
// @route   POST /topics
// @access  Admin
export const createTopic = [
	passport.authenticate("jwt", { session: false }),
	body("name")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Topic name must be at least 1 character long"),

	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const user = req.user as IUser;

		if (user?.userType !== "admin") {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

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
// @access  Admin
export const updateTopic = [
	passport.authenticate("jwt", { session: false }),
	body("name")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Topic name must be at least 1 character long"),

	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const user = req.user as IUser;

		if (user?.userType !== "admin") {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

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
// @access  Admin
export const deleteTopic = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response) => {
		try {
			const user = req.user as IUser;

			if (user?.userType !== "admin") {
				res.status(401).json({ message: "Unauthorized" });
				return;
			}

			const topic = await Topic.findByIdAndDelete(req.params.id);

			if (!topic) {
				res.status(404).json({ message: "Topic not found" });
				return;
			}

			res.status(201).json(topic);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Get popular topics
// @route   GET /topics/popular
// @access  Public
export const getPopularTopics = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			let limit = 10; // default limit
			if (req.query.limit) {
				limit = parseInt(req.query.limit as string);
			}

			let sortBy = "totalPosts"; // default sort
			if (req.query.sortBy) {
				sortBy = req.query.sortBy as string;
			}

			const topics = await Topic.aggregate([
				{
					$lookup: {
						from: "posts",
						let: { topicId: "$_id" },
						pipeline: [
							{
								$match: {
									$expr: {
										$eq: ["$$topicId", "$topic"],
									},
								},
							},
							{
								$unwind: {
									path: "$likes",
									preserveNullAndEmptyArrays: true,
								},
							},
							{
								$group: {
									_id: "$topic",
									totalPosts: { $sum: 1 },
									totalLikes: {
										$sum: { $cond: [{ $ifNull: ["$likes", false] }, 1, 0] },
									},
								},
							},
						],
						as: "postDetails",
					},
				},
				{ $unwind: { path: "$postDetails", preserveNullAndEmptyArrays: true } },
				{
					$project: {
						_id: 1,
						name: 1,
						totalPosts: { $ifNull: ["$postDetails.totalPosts", 0] },
						totalLikes: { $ifNull: ["$postDetails.totalLikes", 0] },
					},
				},
				{
					$sort: { [sortBy]: -1, _id: 1 },
				},
				{
					$limit: limit,
				},
			]);

			res.status(201).json(topics);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);
