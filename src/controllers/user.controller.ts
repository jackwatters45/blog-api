import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import expressAsyncHandler from "express-async-handler";
import Post from "../models/post.model";
import Comment from "../models/comment.model";
import passport from "passport";
import bcrypt from "bcryptjs";
import { startSession } from "mongoose";
import { calculateStartTime } from "./utils";
import { v4 as uuid } from "uuid";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import uploadToCloudinary from "../utils/uploadToCloudinary";
import resizeAvatar from "../utils/resizeImage";

const upload = multer();

// @desc    Get all users
// @route   GET /users
// @access  Public
export const getUsers = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const usersQuery = User.find({ isDeleted: false }, { password: 0 });

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
// @access  Admin
export const getUsersPreviewData = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const user = req.user as IUser;
		if (user.userType !== "admin") {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		try {
			const total = await User.countDocuments();

			const usersQuery = User.aggregate([
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
			]).sort({ createdAt: -1 });

			if (req.query.offset) {
				const offset = parseInt(req.query.offset as string);
				usersQuery.skip(offset);
			}
			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				usersQuery.limit(limit);
			}

			const users = await usersQuery.exec();

			res.json({ users, meta: { totalUsers: total } });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Get user by id
// @route   GET /users/:id
// @access  Public
export const getUserById = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

			const [user, posts, comments] = await Promise.all([
				User.findById(req.params.id, { password: 0 }).populate({
					path: "following",
					options: { limit },
				}),
				Post.find({ published: true, author: req.params.id }).populate({
					path: "topic",
				}),
				Comment.find({ author: req.params.id }).populate({
					path: "post",
					select: "title",
					populate: {
						path: "author",
						select: "firstName lastName",
					},
				}),
			]);

			if (user?.isDeleted) {
				res
					.status(403)
					.json({ isDeleted: true, message: "This user has been deleted." });
				return;
			}

			res.json({ user, posts, comments });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get user by id
// @route   GET /users/:id/deleted
// @access  Admin
export const getDeletedUserById = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const user = req.user as IUser;

		if (user.userType !== "admin") {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		try {
			const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

			const [user, posts, comments] = await Promise.all([
				User.findById(req.params.id, { password: 0 })
					.populate({
						path: "deletedData.deletedBy",
						select: "firstName lastName",
					})
					.populate({
						path: "following",
						select: "firstName lastName avatarUrl",
						options: { limit },
					}),
				Post.find({ published: true, author: req.params.id }).populate({
					path: "topic",
				}),
				Comment.find({ author: req.params.id }).populate({
					path: "post",
					select: "title",
					populate: {
						path: "author",
						select: "firstName lastName",
					},
				}),
			]);

			res.json({ user, posts, comments });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Create user
// @route   POST /users
// @access  Admin
export const createUser = [
	passport.authenticate("jwt", { session: false }),
	upload.single("avatar"),
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
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const reqUser = req.user as IUser;
		if (reqUser.userType !== "admin") {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		try {
			const { firstName, lastName, email, username, userType } = req.body;

			let avatarUrl = "";
			const resizedAvatar = await resizeAvatar(req.file);
			if (resizedAvatar) avatarUrl = await uploadToCloudinary(resizedAvatar);

			const userExists = await User.findOne({ email });
			if (userExists) {
				res.status(400).json({ email: "Email already exists" });
				return;
			}

			const hashedPassword = await bcrypt.hash(req.body.password, 10);
			const user = new User({
				firstName,
				lastName,
				password: hashedPassword,
				email,
				username,
				userType,
				avatarUrl,
			});

			const result = await user.save();
			if (!result) {
				res.status(500).json("Could not save user");
				return;
			}

			res.status(201).json(user);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Update user password
// @route   Patch /users/:id/password
// @access  Private
export const updateUserPassword = [
	passport.authenticate("jwt", { session: false }),
	body("password")
		.trim()
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),
	body("confirmPassword").custom((value, { req }) => {
		if (value !== req.body.password) throw new Error("Passwords must match");
		return true;
	}),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const reqUser = req.user as IUser;
		if (
			reqUser.userType !== "admin" &&
			reqUser._id.toString() !== req.params.id
		) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		try {
			const { password } = req.body;

			const hashedPassword = await bcrypt.hash(password, 10);

			const result = await User.findByIdAndUpdate(
				req.params.id,
				{ password: hashedPassword },

				{ new: true },
			);

			if (!result) {
				res.status(404).json({ message: "User not found" });
				return;
			}

			res.status(200).json({ message: "Password updated successfully" });
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
	upload.single("avatar"),
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

	body("userType").optional().trim().isIn(["admin", "user"]),
	body("description").optional().trim(),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const reqUser = req.user as IUser;
		const userId = req.params.id;
		if (String(reqUser._id) !== userId && reqUser.userType !== "admin") {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		try {
			const user = await User.findById(userId);

			if (!user) {
				res.status(404).json({ message: "User not found" });
				return;
			}

			const resizedAvatar = await resizeAvatar(req.file);
			if (resizedAvatar)
				req.body.avatarUrl = await uploadToCloudinary(resizedAvatar);

			// if user has avatar and new avatar is uploaded, delete old avatar
			if (user.avatarUrl && req.body.avatarUrl) {
				const result = await cloudinary.uploader.destroy(user.avatarUrl);
				if (result.result !== "ok") {
					res
						.status(500)
						.json({ message: "Could not delete old avatar from cloudinary" });
					return;
				}
			}

			user.set(req.body);
			const updatedUser = await user.save();

			if (!updatedUser) {
				res.status(400).json({ message: "Could not update user" });
				return;
			}

			res.json({ message: "User updated successfully" });
		} catch (error) {
			console.log(error);
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Delete user
// @route   PATCH /users/:id
// @access  Private
export const deleteUser = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const user = req.user as IUser;
		const userId = req.params.id;

		if (String(user._id) !== userId && user.userType !== "admin") {
			res.status(401).json({
				message:
					"Unauthorized: user is not an admin or is trying to delete someone who they are not permitted to delete.",
			});
			return;
		}

		const session = await startSession();
		session.startTransaction();

		try {
			const userToDelete = await User.findById(userId).session(session);
			if (!userToDelete) {
				res.status(404).json({ message: "User not found" });
				return;
			}

			const deletedBy = String(user._id) === userId ? null : user._id;

			const deletedUser = await User.findByIdAndUpdate(
				userId,
				{
					isDeleted: true,
					"deletedData.deletedBy": deletedBy,
					"deletedData.deletedAt": new Date(),
					"deletedData.email": userToDelete.email,
					"deletedData.username": userToDelete.username,
					"deletedData.followerCount": userToDelete.followers.length ?? 0,
					email: `redacted-${uuid()}`,
					username: `redacted-${uuid()}`,
					password: "",
				},
				{
					new: true,
					session: session,
				},
			);

			if (!deletedUser) {
				res.status(404).json({ message: "User not found" });
				return;
			}

			await User.updateMany(
				{},
				{ $pull: { followers: userId, following: userId } },
				{ session: session },
			);

			await session.commitTransaction();

			res.json({ userToDelete });
		} catch (error) {
			await session.abortTransaction();

			if (error.message === "User not found") {
				res.status(404).json({ message: error.message });
			} else {
				console.log(error);
				res.status(500).json({ message: error.message });
			}
		} finally {
			session.endSession();
		}
	}),
];

// @desc    Search users by specific field
// @route   GET /users/search?field=value
// @access  Public
export const searchUsers = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const users = await User.find(
				{
					$text: { $search: req.query.q as string },
					isDeleted: false,
				},
				{ password: 0, email: 0 },
			);

			res.json(users);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get user posts
// @route   GET /users/:id/posts
// @access  Public
export const getUserPosts = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const user = await User.findById(req.params.id);
			if (!user || user.isDeleted) {
				res.status(404).json({ message: "User not found or has been deleted" });
				return;
			}

			const total = await Post.countDocuments({ author: req.params.id });
			const postsQuery = Post.find({ author: req.params.id }).populate("topic");

			if (req.query.offset) {
				const offset = parseInt(req.query.offset as string);
				postsQuery.skip(offset);
			}
			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				postsQuery.limit(limit);
			}

			const posts = await postsQuery.exec();
			res.json({ posts, meta: { total } });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get Users whose posts have the most like
// @route   GET /users/popular
// @access  Public
export const getPopularAuthors = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const start = calculateStartTime(req.query.timeRange as string);

			const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

			const authorCount = await Post.aggregate([
				{
					$lookup: {
						from: "users",
						localField: "author",
						foreignField: "_id",
						as: "author",
					},
				},
				{
					$unwind: "$author",
				},
				{
					$match: {
						"author.isDeleted": false,
					},
				},
				{
					$group: {
						_id: "$author._id",
					},
				},
				{
					$count: "totalAuthors",
				},
			]);

			let usersQuery = Post.aggregate([
				{
					$match: {
						published: true,
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
						likesCount: { $sum: "$isInRange" },
					},
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
					$match: {
						"user.isDeleted": false,
					},
				},
				{
					$sort: { likesCount: -1, _id: 1 },
				},
				{
					$limit: limit,
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
						likesCount: 1,
					},
				},
			]);

			if (req.query.offset) {
				const offset = parseInt(req.query.offset as string);
				usersQuery = usersQuery.skip(offset);
			}

			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				usersQuery = usersQuery.limit(limit);
			}

			const users = await usersQuery.exec();

			res
				.json({
					users,
					meta: {
						total: authorCount.length > 0 ? authorCount[0].totalAuthors : 0,
					},
				})
				.status(201);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get user following
// @route   GET /users/:id/following
// @access  Public
export const getUserFollowing = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const user = await User.findById(req.params.id)
				.populate("following", "username followers")
				.select("following");
			if (!user || user.isDeleted) {
				res.status(404).json({ message: "User not found or has been deleted" });
				return;
			}

			res.json({ following: user.following });
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
	expressAsyncHandler(async (req: Request, res: Response) => {
		const session = await startSession();
		session.startTransaction();

		const user = req.user as IUser;
		if (!user || user.isDeleted) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		const userId = user._id;
		if (req.params.id === userId.toString()) {
			res.status(400).json({ message: "You can't follow yourself" });
			return;
		}

		try {
			const userFollowed = await User.findById(req.params.id);

			if (!userFollowed || userFollowed.isDeleted) {
				await session.abortTransaction();
				session.endSession();
				res.status(404).json({ message: "User not found" });
				return;
			}

			await User.findByIdAndUpdate(
				req.params.id,
				{ $addToSet: { followers: userId } },
				{ new: true, session },
			);

			const userFollowing = await User.findByIdAndUpdate(
				userId,
				{ $addToSet: { following: req.params.id } },
				{ new: true, session },
			);

			if (!userFollowing || userFollowing.isDeleted) {
				await session.abortTransaction();
				session.endSession();
				res.status(404).json({ message: "User not found" });
				return;
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
	expressAsyncHandler(async (req: Request, res: Response) => {
		const session = await startSession();
		session.startTransaction();

		const user = req.user as IUser;
		if (!user || user.isDeleted) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		const userId = user._id;
		if (req.params.id === userId.toString()) {
			res.status(400).json({ message: "You can't unfollow yourself" });
			return;
		}

		try {
			const userUnfollowed = await User.findById(req.params.id);

			if (!userUnfollowed || userUnfollowed.isDeleted) {
				await session.abortTransaction();
				session.endSession();
				res.status(404).json({ message: "User not found" });
				return;
			}

			await User.findByIdAndUpdate(
				req.params.id,
				{ $pull: { followers: userId } },
				{ new: true, session },
			);

			const userUnfollowing = await User.findByIdAndUpdate(
				userId,
				{ $pull: { following: req.params.id } },
				{ new: true, session },
			);

			if (!userUnfollowing || userUnfollowing.isDeleted) {
				await session.abortTransaction();
				session.endSession();
				res.status(404).json({ message: "User not found" });
				return;
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
