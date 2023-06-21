import expressAsyncHandler from "express-async-handler";
import { check, validationResult } from "express-validator";
import { Request, Response } from "express";
import Post from "../models/post.model";
import User, { IUser } from "../models/user.model";
import Topic from "../models/topic.model";
import passport from "passport";

// @desc    Search All
// @route   GET /search?q=value
// @access  Public
export const searchAll = [
	check("q").isLength({ min: 1, max: 50 }).trim().escape(),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		if (!req.query.q) {
			res.status(400).json({ message: "Search query is required" });
			return;
		}

		try {
			const search = req.query.q as string;

			const posts = await Post.find(
				{ $text: { $search: search } },
				{ score: { $meta: "textScore" } },
			)
				.populate({ path: "author", select: "firstName lastName isDeleted" })
				.populate({ path: "topic", select: "name" })
				.sort({ score: { $meta: "textScore" } });

			const users = await User.aggregate([
				{
					$match: {
						$text: { $search: search },
						isDeleted: false,
					},
				},
				{
					$addFields: {
						score: { $meta: "textScore" },
					},
				},
				{
					$project: {
						firstName: 1,
						lastName: 1,
						email: 1,
						username: 1,
						userType: 1,
						updatedAt: 1,
						followersCount: { $size: "$followers" },
						followingCount: { $size: "$following" },
						isDeleted: 1,
					},
				},
				{
					$sort: { score: { $meta: "textScore" } },
				},
			]);

			User.find(
				{
					isDeleted: false,
					$text: { $search: search },
				},
				{ score: { $meta: "textScore" } },
			)
				.select({ password: 0, email: 0 })
				.sort({ score: { $meta: "textScore" } });

			const topics = await Topic.find(
				{ $text: { $search: req.query.q as string } },
				{ score: { $meta: "textScore" } },
			);

			res.status(200).json({ posts, users, topics });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Search posts
// @route   GET /search/posts?q=value
// @access  Public
export const searchPosts = [
	check("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty() && req.query.q) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		try {
			let postsQuery;
			if (req.query.q) {
				postsQuery = Post.find(
					{ $text: { $search: req.query.q as string } },
					{ score: { $meta: "textScore" } },
				).sort({ score: { $meta: "textScore" } });
			} else {
				postsQuery = Post.find().sort({ createdAt: -1 });
			}

			const posts = await postsQuery
				.populate({ path: "author", select: "firstName lastName isDeleted" })
				.populate({ path: "topic", select: "name" });

			res.status(200).json(posts);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Search posts by the authenticated user
// @route   GET /search/my-posts?q=value
// @access  Private
export const searchMyPosts = [
	passport.authenticate("jwt", { session: false }),
	check("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty() && req.query.q) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const user = req.user as IUser;
		if (!user) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		try {
			let postsQuery;
			if (req.query.q) {
				postsQuery = Post.find(
					{ author: user._id, $text: { $search: req.query.q as string } },
					{ score: { $meta: "textScore" } },
				).sort({ score: { $meta: "textScore" } });
			} else {
				postsQuery = Post.find({ author: user._id }).sort({ createdAt: -1 });
			}

			const posts = await postsQuery
				.populate({ path: "author", select: "firstName lastName isDeleted" })
				.populate({ path: "topic", select: "name" });

			res.status(200).json(posts);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Search users
// @route   GET /search/users?q=value
// @access  Public
export const searchUsers = [
	check("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty() && req.query.q) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		try {
			let usersQuery;
			if (req.query.q) {
				usersQuery = User.find(
					{
						$text: { $search: req.query.q as string },
						isDeleted: false,
					},
					{ score: { $meta: "textScore" } },
				).sort({ score: { $meta: "textScore" } });
			} else {
				usersQuery = User.find({ isDeleted: false }).sort({ createdAt: -1 });
			}

			const users = await usersQuery.select({ password: 0, email: 0 });

			res.status(200).json(users);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Search users (includes password and email + deleted users)
// @route   GET /search/admin/users?q=value
// @access  Admin
export const searchUsersAdmin = [
	passport.authenticate("jwt", { session: false }),
	check("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty() && req.query.q) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const user = req.user as IUser;
		if (user?.userType !== "admin") {
			res
				.status(403)
				.json({ message: "You are not authorized to perform this action" });
			return;
		}

		try {
			let usersQuery;
			if (req.query.q) {
				usersQuery = User.aggregate([
					{
						$match: {
							$text: { $search: req.query.q as string },
						},
					},
					{
						$addFields: {
							score: { $meta: "textScore" },
						},
					},
					{
						$project: {
							firstName: 1,
							lastName: 1,
							email: 1,
							username: 1,
							userType: 1,
							updatedAt: 1,
							followersCount: { $size: "$followers" },
							followingCount: { $size: "$following" },
							deletedData: 1,
							isDeleted: 1,
							score: 1,
						},
					},
					{
						$sort: { score: { $meta: "textScore" } },
					},
				]);
			} else {
				usersQuery = User.aggregate([
					{
						$project: {
							firstName: 1,
							lastName: 1,
							email: 1,
							username: 1,
							userType: 1,
							updatedAt: 1,
							followersCount: { $size: "$followers" },
							followingCount: { $size: "$following" },
							isDeleted: 1,
							deletedData: 1,
						},
					},
					{
						$sort: { createdAt: -1 },
					},
				]);
			}

			const users = await usersQuery;

			res.status(200).json(users);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Search topics
// @route   GET /search/topics?q=value
// @access  Public
export const searchTopics = [
	check("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty() && req.query.q) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		try {
			const topics = await Topic.find(
				{ $text: { $search: req.query.q as string } },
				{ score: { $meta: "textScore" } },
			).sort({ score: { $meta: "textScore" } });

			res.status(200).json(topics);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];
