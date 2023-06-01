/* eslint-disable @typescript-eslint/no-explicit-any */
import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import expressAsyncHandler from "express-async-handler";
import Post from "../models/post.model";
import Comment from "../models/comment.model";
import passport from "passport";
import bcrypt from "bcryptjs";
import { startSession } from "mongoose";

// @desc    Get all users
// @route   GET /users
// @access  Public
export const getUsers = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const usersQuery = User.find();

			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				usersQuery.limit(limit);
			}

			const users = await usersQuery.exec();
			res.json(users);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get all users projecting only fields necessary for preview
// @route   GET /users/preview
// @access  Public
export const getUsersPreviewData = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			const users = await User.aggregate([
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
					},
				},
			]).sort({ createdAt: -1 });

			res.json(users);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get user by id
// @route   GET /users/:id
// @access  Public
export const getUserById = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
			const [user, posts, comments] = await Promise.all([
				User.findById(req.params.id).populate({
					path: "following",
					options: { limit },
				}),
				Post.find({ published: true, author: req.params.id }).populate({
					path: "author",
					select: "firstName lastName",
				}),
				Comment.find({ author: req.params.id }).populate([
					{
						path: "author",
						select: "firstName lastName",
					},
					{
						path: "post",
						select: "title",
						populate: {
							path: "author",
							select: "firstName lastName",
						},
					},
				]),
			]);

			res.json({ user, posts, comments });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create user
// @route   POST /users
// @access  Public
export const createUser = [
	passport.authenticate("jwt", { session: false }),
	body("firstName")
		.trim()
		.isLength({ min: 2 })
		.withMessage("First name must be at least 2 characters long"),
	body("lastName")
		.trim()
		.isLength({ min: 2 })
		.withMessage("Last name must be at least 2 characters long"),
	body("email").trim().isEmail().withMessage("Email must be valid"),
	body("username")
		.trim()
		.isLength({ min: 2 })
		.withMessage("Username must be at least 2 characters long"),
	body("password")
		.trim()
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),
	body("confirmPassword").custom((value, { req }) => {
		if (value !== req.body.password) {
			throw new Error("Passwords must match");
		}
		return true;
	}),
	body("userType")
		.optional()
		.trim()
		.isIn(["admin", "user"])
		.withMessage("User type must be either admin or user"),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const { firstName, lastName, email, username, userType } = req.body;

			const userExists = await User.findOne({ email });
			if (userExists)
				return res.status(400).json({ email: "Email already exists" });

			const hashedPassword = await bcrypt.hash(req.body.password, 10);
			const user = new User({
				firstName,
				lastName,
				password: hashedPassword,
				email,
				username,
				userType,
			});

			const result = await user.save();
			if (!result) return res.status(500).json("Could not save user");
			res.status(201).json(user);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Update user
// @route   Patch /users/:id
// @access  Private
export const updateUser = [
	passport.authenticate("jwt", { session: false }),
	body("firstName")
		.optional()
		.trim()
		.isLength({ min: 2 })
		.withMessage("First name must be at least 2 characters long"),
	body("lastName")
		.optional()
		.trim()
		.isLength({ min: 2 })
		.withMessage("Last name must be at least 2 characters long"),
	body("email").optional().trim().isEmail().withMessage("Email must be valid"),
	body("username").optional().trim().isLength({ min: 2 }),
	body("password")
		.optional({ nullable: true, checkFalsy: true })
		.trim()
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),
	body("confirmPassword")
		.optional({ nullable: true, checkFalsy: true })
		.custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error("Passwords must match");
			}
			return true;
		}),
	body("userType").optional().trim().isIn(["admin", "user"]),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors);
			// return res.status(400).json({ errors: errors.array() });
			return res.status(400).json({ message: "Errors meep" });
		}

		try {
			const user: IUser | null = await User.findByIdAndUpdate(
				req.params.id,
				req.body,
				{ new: true },
			);
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}
			res.json(user);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Delete user
// @route   DELETE /users/:id
// @access  Private
export const deleteUser = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		try {
			const user: IUser | null = await User.findByIdAndDelete(req.params.id);
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}
			res.json(user);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Search users by specific field
// @route   GET /users/search?field=value
// @access  Public
export const searchUsers = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			const users = await User.find({
				$text: { $search: req.query.q as string },
			});

			res.json(users);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Delete user by query
// @route   DELETE /users?field=value
// @access  Private
export const deleteUserByQuery = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		try {
			const query = req.query;
			const user: IUser | null = await User.findOneAndDelete(query);
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}
			res.json(user);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Get user posts
// @route   GET /users/:id/posts
// @access  Public
export const getUserPosts = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			const postsQuery = Post.find({ author: req.params.id }).populate("topic");

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

// @desc    Get Users whose posts have the most like
// @route   GET /users/popular
// @access  Public
export const getPopularAuthors = expressAsyncHandler(
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

			const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

			const users = await Post.aggregate([
				{
					$addFields: {
						likesCount: { $size: "$likes" },
					},
				},
				{
					$unwind: {
						path: "$likes",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$addFields: {
						isInRange: {
							$cond: {
								if: { $gte: ["$likes.date", start] },
								then: 1,
								else: 0,
							},
						},
					},
				},
				{
					$group: {
						_id: "$author",
						likesCountInTimeRange: { $sum: "$isInRange" },
						likesCount: { $first: "$likesCount" },
					},
				},
				{
					$sort: { likesCountInTimeRange: -1, _id: 1 },
				},
				{
					$limit: limit,
				},
				{
					$lookup: {
						from: "users",
						localField: "_id",
						foreignField: "_id",
						as: "user",
					},
				},
				{
					$unwind: "$user",
				},
				{
					$project: {
						_id: "$user._id",
						firstName: "$user.firstName",
						lastName: "$user.lastName",
						username: "$user.username",
						description: "$user.description",
						followers: "$user.followers",
						createdAt: "$user.createdAt",
						likesCountInTimeRange: 1,
						likesCount: 1,
					},
				},
			]);
			res.json(users);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Add follower to user
// @route   PUT /users/:id/follow
// @access  Private
export const addFollower = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const session = await startSession();
		session.startTransaction();

		try {
			const userFollowed = await User.findByIdAndUpdate(
				req.params.id,
				{ $addToSet: { followers: (req.user as IUser)?._id } },
				{ new: true, session },
			);

			const userFollowing = await User.findByIdAndUpdate(
				(req.user as IUser)?._id,
				{ $addToSet: { following: req.params.id } },
				{ new: true, session },
			);

			if (!userFollowed || !userFollowing) {
				await session.abortTransaction();
				session.endSession();
				return res.status(404).json({ message: "User not found" });
			}

			await session.commitTransaction();
			session.endSession();
			res.json({ userFollowed, userFollowing });
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Remove follower from user
// @route   PUT /users/:id/unfollow
// @access  Private
export const removeFollower = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const session = await startSession();
		session.startTransaction();

		try {
			const userUnfollowed = await User.findByIdAndUpdate(
				req.params.id,
				{ $pull: { followers: (req.user as IUser)?._id } },
				{ new: true, session },
			);

			const userUnfollowing = await User.findByIdAndUpdate(
				(req.user as IUser)?._id,
				{ $pull: { following: req.params.id } },
				{ new: true, session },
			);

			if (!userUnfollowed || !userUnfollowing) {
				await session.abortTransaction();
				session.endSession();
				return res.status(404).json({ message: "User not found" });
			}

			await session.commitTransaction();
			session.endSession();
			res.json({ userUnfollowed, userUnfollowing });
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			res.status(500).json({ message: error.message });
		}
	}),
];
