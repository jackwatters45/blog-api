import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Post from "../models/post.model";
import User, { IUser } from "../models/user.model";
import expressAsyncHandler from "express-async-handler";
import passport from "passport";
import { calculateStartTime } from "../utils/calculateStartTime";
import { Types } from "mongoose";

// @desc    Get all posts
// @route   GET /posts
// @access  Public
export const getPosts = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const match = { published: true };
			const postsCount = await Post.countDocuments(match);
			const postsQuery = Post.find(match)
				.populate("author", "firstName lastName isDeleted")
				.populate("topic", "name")
				.sort({ createdAt: -1 });

			if (req.query.offset) {
				const offset = parseInt(req.query.offset as string);
				postsQuery.skip(offset);
			}
			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				postsQuery.limit(limit);
			}

			const posts = await postsQuery.exec();
			res.status(200).json({ posts, meta: { total: postsCount } });
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
	expressAsyncHandler(async (req: Request, res: Response) => {
		try {
			const user = req.user as IUser;
			if (!user) {
				res.status(401).json({ message: "No user logged in" });
				return;
			}
			if (user.userType !== "admin") {
				res.status(403).json({ message: "Unauthorized" });
				return;
			}

			const postsCount = await Post.countDocuments({});
			const posts = await Post.find(
				{},
				{ title: 1, updatedAt: 1, likes: 1, comments: 1 },
			)
				.populate("author", "firstName lastName isDeleted")
				.populate("topic", "name")
				.sort({ createdAt: -1 });

			res.status(200).json({ posts, meta: { total: postsCount } });
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
				.populate(
					"author",
					"firstName lastName description followers isDeleted avatarUrl",
				)
				.populate("likes", "email")
				.populate("topic", "name")
				.populate({
					path: "comments",
					populate: {
						path: "author",
						select: "firstName lastName isDeleted avatarUrl",
					},
				});

			res.status(200).json(post);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create post
// @route   POST /posts
// @access  Private
export const createPost = [
	passport.authenticate("jwt", { session: false }),
	body("title")
		.trim()
		.isLength({ min: 5, max: 100 })
		.withMessage("Title must be at least 5 and less than 100 characters long"),
	body("content")
		.trim()
		.isLength({ min: 250, max: 10000 })
		.withMessage(
			"Title must be at least 250 and less than 10000 characters long",
		),
	body("topic").isMongoId().withMessage("Topic must be an ObjectId"),
	body("published")
		.notEmpty()
		.isBoolean()
		.withMessage("Published must be a boolean"),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const author = req.user as IUser;
		if (!author) {
			res.status(401).json({ message: "Author is required" });
			return;
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
	passport.authenticate("jwt", { session: false }),
	body("title")
		.optional()
		.trim()
		.isLength({ min: 5, max: 100 })
		.withMessage("Title must be at least 5 and less than 100 characters long"),
	body("content")
		.optional()
		.trim()
		.isLength({ min: 250, max: 10000 })
		.withMessage(
			"Content must be at least 250 and less than 10000 characters long",
		),
	body("topic").optional().isMongoId().withMessage("Topic must be an ObjectId"),
	body("published")
		.optional()
		.isBoolean()
		.withMessage("Published must be a boolean"),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}
		const { title, content, topic, published } = req.body;
		try {
			const user = req.user as IUser;
			if (!user) {
				res.status(401).json({ message: "No user logged in" });
				return;
			}

			const post = await Post.findById(req.params.id);
			if (!post) {
				res.status(404).json({ message: "Post not found" });
				return;
			}

			if (post.author.toString() !== user.id && user.userType !== "admin") {
				res.status(403).json({
					message: "Only admin and the original author can update post",
				});
				return;
			}

			post.title = title;
			post.content = content;
			post.topic = topic;
			post.published = published;

			const updatedPost = await post.save();
			res.status(201).json(updatedPost);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Delete post
// @route   DELETE /posts/:id
// @access  Private
export const deletePost = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response) => {
		try {
			const user = req.user as IUser;
			if (!user) {
				res.status(401).json({ message: "No user logged in" });
				return;
			}

			const post = await Post.findById(req.params.id);
			if (!post) {
				res.status(404).json({ message: "Post not found" });
				return;
			}

			if (post.author.toString() !== user.id && user.userType !== "admin") {
				res.status(403).json({ message: "Unauthorized" });
				return;
			}

			const result = await Post.findByIdAndDelete(req.params.id);

			if (!result) {
				res.status(404).json({ message: "Delete failed" });
				return;
			}

			res.status(200).json(result);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Like post
// @route   PUT /posts/:id/like
// @access  Private
export const likePost = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const user = req.user as IUser;
		if (!user) {
			res.status(401).json({ message: "No user logged in" });
			return;
		}

		try {
			const postId = req.params.id;
			const post = await Post.findById(postId);
			if (!post) {
				res.status(404).json({ message: "Post not found" });
				return;
			}

			const hasLiked = post.likes.some(
				(like) => like.userId.toString() === user._id.toString(),
			);
			if (hasLiked) {
				res.status(400).json({ message: "You have already liked this post" });
				return;
			}

			post.likes.push({ userId: user._id, date: new Date() });
			const updatedPost = await post.save();

			res.status(201).json(updatedPost);
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
	expressAsyncHandler(async (req: Request, res: Response) => {
		const user = req.user as IUser;
		if (!user) {
			res.status(401).json({ message: "No user logged in" });
			return;
		}

		try {
			const postId = req.params.id;
			const post = await Post.findById(postId);
			if (!post) {
				res.status(404).json({ message: "Post not found" });
				return;
			}

			const hasLiked = post.likes.some(
				(like) => like.userId.toString() === user._id.toString(),
			);
			if (!hasLiked) {
				res.status(400).json({ message: "You have not liked this post yet" });
				return;
			}

			post.likes = post.likes.filter(
				(like) => like.userId.toString() !== user._id.toString(),
			);
			const updatedPost = await post.save();

			res.status(201).json(updatedPost);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc		Get number of likes
// @route		GET /posts/:id/likes
// @access		Public
export const getLikes = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const post = await Post.findById(req.params.id).select("likes");
			if (!post) {
				res.status(404).json({ message: "Post not found" });
				return;
			}

			res.status(200).json(post.likes.length);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get popular posts
// @route   GET /posts/popular
// @access  Public
export const getPopularPosts = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const start = calculateStartTime(req.query.timeRange as string);

			const postsCount = await Post.countDocuments({ published: true });
			let postsQuery = Post.aggregate([
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
						likeCount: { $size: "$filteredLikes" },
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

			if (req.query.offset) {
				const offset = parseInt(req.query.offset as string);
				postsQuery = postsQuery.skip(offset);
			}

			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				postsQuery = postsQuery.limit(limit);
			}

			const posts = await postsQuery.exec();

			res.status(200).json({ posts, meta: { total: postsCount } });
		} catch (error) {
			console.log(error);
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get posts by users that the current user follows
// @route   GET /posts/following
// @access  Private
export const getFollowingPosts = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const user = req.user as IUser;
		if (!user) {
			res.status(401).json({ message: "No user logged in" });
			return;
		}

		try {
			const match = {
				published: true,
				author: { $in: user.following },
			};

			const postsCount = await Post.countDocuments(match);

			const postsQuery = Post.find(match)
				.populate("author", "firstName lastName isDeleted")
				.populate("topic", "name")
				.sort({ createdAt: -1 });

			if (req.query.offset) {
				const offset = parseInt(req.query.offset as string);
				postsQuery.skip(offset);
			}
			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				postsQuery.limit(limit);
			}

			const posts = await postsQuery.exec();

			if (!posts) {
				res.status(404).json({ message: "No posts found" });
				return;
			}

			res.status(200).json({ posts, meta: { total: postsCount } });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Server Error" });
		}
	}),
];

// @desc    Toggle saved post
// @route   PUT /users/:id/saved-posts/:id
// @access  Private
export const toggleSavedPost = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const user = req.user as IUser;
		if (!user) {
			res.status(401).json({ message: "No user logged in" });
			return;
		}

		try {
			const userId = user._id;

			// Check if post is currently saved
			const postId = new Types.ObjectId(req.params.id);
			const isPostSaved = user.savedPosts.includes(postId);

			// If it is, remove it. Otherwise, add it.
			const updateOperation = isPostSaved
				? { $pull: { savedPosts: req.params.id } }
				: { $addToSet: { savedPosts: req.params.id } };

			const userUpdated = await User.findByIdAndUpdate(
				userId,
				updateOperation,
				{ new: true },
			);

			res.status(200).json({ userUpdated });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];
