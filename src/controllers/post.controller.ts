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
			const posts = await Post.find({ published: true })
				.populate("author", "firstName lastName")
				.populate("likes", "email")
				.populate({
					path: "comments",
					select: "content",
					populate: { path: "author", select: "firstName lastName" },
				});
			res.json(posts);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get post by id
// @route   GET /posts/:id
// @access  Public
export const getPostById = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const post = await Post.findById(req.params.id)
				.populate("author", "firstName lastName")
				.populate("likes", "email")
				.populate({
					path: "comments",
					select: "content",
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
	body("tags").optional().isArray().withMessage("Tags must be an array"),
	body("author")
		.optional()
		.isMongoId()
		.withMessage("Author must be a valid ID"),
	body("published")
		.optional()
		.isBoolean()
		.withMessage("Published must be a boolean"),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// TODO test
		const author = req.user as IUser;
		if (!author) {
			return res.status(400).json({ message: "Author is required" });
		}

		const { title, content, tags, published } = req.body;

		try {
			const post = new Post({
				title,
				content,
				tags,
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
		.isLength({ min: 100 })
		.withMessage("Content must be at least 100 characters long"),
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
export const likePost = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		const user = req.user as IUser;
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			const post = await Post.findByIdAndUpdate(
				req.params.id,
				{ $addToSet: { likes: user._id } },
				{ new: true },
			);
			res.json(post);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Unlike post
// @route   PUT /posts/:id/unlike
// @access  Private
export const unlikePost = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		const user = req.user as IUser;
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			const post = await Post.findByIdAndUpdate(
				req.params.id,
				{ $pull: { likes: user._id } },
				{ new: true },
			);
			res.json(post);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// // @desc    Search posts
// // @route   GET /posts/search
// // @access  Public
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
