/* eslint-disable @typescript-eslint/no-explicit-any */
import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Post from "../models/post.model";
import { IUser } from "../models/user.model";
import expressAsyncHandler from "express-async-handler";
import passport from "passport";

// @desc    Get all posts
// @route   GET /posts
// @access  Public
export const getPosts = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const postsQuery = Post.find({ published: true })
				.populate("author", "firstName lastName")
				.populate("topic", "name")
				.sort({ createdAt: -1 });

			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				postsQuery.limit(limit);
			}

			const posts = await postsQuery.exec();
			res.json(posts);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get all post projecting only fields necessary for preview
// @route   GET /posts/preview
// @access  Admin
export const getPostsPreview = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		try {
			const user = req.user as IUser;
			if (user.userType !== "admin")
				return res.status(401).json({ message: "Unauthorized" });

			const posts = await Post.find(
				{},
				{ title: 1, updatedAt: 1, likes: 1, comments: 1 },
			)
				.populate("author", "firstName lastName")
				.populate("topic", "name")
				.sort({ createdAt: -1 });

			res.json(posts);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Get post by id
// @route   GET /posts/:id
// @access  Public
export const getPostById = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const post = await Post.findById(req.params.id)
				.populate("author", "firstName lastName description followers")
				.populate("likes", "email")
				.populate("topic", "name")
				.populate({
					path: "comments",
					populate: { path: "author", select: "firstName lastName" },
				});

			res.json(post);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create post
// @route   POST /posts
// @access  Private
// TODO change content length to 100
export const createPost = [
	passport.authenticate("jwt", { session: false }),
	body("title")
		.trim()
		.isLength({ min: 5 })
		.withMessage("Title must be at least 5 characters long"),
	body("content")
		.trim()
		.isLength({ min: 10 })
		.withMessage("Content must be at least 100 characters long"),
	body("topic").notEmpty().withMessage("Topic is required"),
	body("published")
		.optional()
		.isBoolean()
		.withMessage("Published must be a boolean"),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const author = req.user as IUser;
		if (!author) {
			return res.status(400).json({ message: "Author is required" });
		}

		const { title, content, topic, published } = req.body;

		try {
			const post = new Post({
				title,
				content,
				topic,
				author,
				published,
			});
			await post.save();
			res.status(201).json(post);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Update post
// @route   PUT /posts/:id
// @access  Private
export const updatePost = [
	body("title")
		.optional()
		.trim()
		.isLength({ min: 5 })
		.withMessage("Title must be at least 5 characters long"),
	body("content")
		.optional()
		.trim()
		.isLength({ min: 500 })
		.withMessage("Content must be at least 500 characters long"),
	body("topic").optional().notEmpty().withMessage("Topic is required"),
	body("tags").optional().isArray().withMessage("Tags must be an array"),
	body("published")
		.optional()
		.isBoolean()
		.withMessage("Published must be a boolean"),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { title, content, tags, published } = req.body;
		try {
			const post = await Post.findByIdAndUpdate(
				req.params.id,
				{
					title,
					content,
					tags,
					published,
				},
				{ new: true },
			);
			res.json(post);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Delete post
// @route   DELETE /posts/:id
// @access  Private
export const deletePost = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			const post = await Post.findByIdAndDelete(req.params.id);

			if (!post) {
				return res.status(404).json({ message: "Post not found" });
			}

			res.json(post);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Like post
// @route   PUT /posts/:id/like
// @access  Private
export const likePost = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const user = req.user as IUser;
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			const post = await Post.findByIdAndUpdate(
				req.params.id,
				{ $addToSet: { likes: { userId: user._id, date: new Date() } } },
				{ new: true },
			);

			if (!post) return res.status(404).json({ message: "Post not found" });

			res.json(post);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Unlike post
// @route   PUT /posts/:id/unlike
// @access  Private
export const unlikePost = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const user = req.user as IUser;
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		console.log(user._id);
		try {
			const post = await Post.findByIdAndUpdate(
				req.params.id,
				{ $pull: { likes: { userId: user._id } } },
				{ new: true },
			);

			if (!post) {
				return res.status(404).json({ message: "Post not found" });
			}

			res.json(post);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];
// @desc		Get number of likes
// @route		GET /posts/:id/likes
// @access		Public
export const getLikes = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			const post = await Post.findById(req.params.id);
			if (!post) {
				return res.status(404).json({ message: "Post not found" });
			}

			res.json(post.likes?.length);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Search posts
// @route   GET /posts/search
// @access  Public
export const searchPosts = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			const posts = await Post.find({
				$text: { $search: req.query.q as string },
			});
			res.json(posts);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get popular posts
// @route   GET /posts/popular
// @access  Public
export const getPopularPosts = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			let start;
			switch (req.query.timeRange) {
				case "lastYear":
					start = new Date();
					start.setFullYear(start.getFullYear() - 1);
					break;
				case "lastMonth":
					start = new Date();
					start.setMonth(start.getMonth() - 1);
					break;
				case "lastWeek":
					start = new Date();
					start.setDate(start.getDate() - 7);
					break;
				case "today":
					start = new Date();
					start.setHours(0, 0, 0, 0);
					break;
				default:
					start = new Date(0);
			}

			const postsQuery = Post.aggregate([
				{
					$match: {
						published: true,
					},
				},
				{
					$addFields: {
						filteredLikes: {
							$filter: {
								input: "$likes",
								as: "like",
								cond: { $gte: ["$$like.date", start] },
							},
						},
					},
				},
				{
					$addFields: {
						likeCount: {
							$size: "$filteredLikes",
						},
					},
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
					$lookup: {
						from: "topics",
						localField: "topic",
						foreignField: "_id",
						as: "topic",
					},
				},
				{
					$unwind: {
						path: "$topic",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$sort: {
						likeCount: -1,
					},
				},
			]);

			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				postsQuery.limit(limit);
			}

			const posts = await postsQuery.exec();

			res.json(posts);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);
