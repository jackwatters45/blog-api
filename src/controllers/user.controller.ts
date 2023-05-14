/* eslint-disable @typescript-eslint/no-explicit-any */
import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import expressAsyncHandler from "express-async-handler";
import Post from "../models/post.model";
import Comment from "../models/comment.model";
import passport from "passport";

// @desc    Get all users
// @route   GET /users
// @access  Public
export const getUsers = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const users = await User.find();
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
			const [user, posts, comments] = await Promise.all([
				User.findById(req.params.id),
				Post.find({ published: true, author: req.params.id }),
				Comment.find({ author: req.params.id }),
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
			const { firstName, lastName, email, password, userType } = req.body;
			const user: IUser = new User({
				firstName,
				lastName,
				email,
				password,
				userType,
			});
			await user.save();
			res.status(201).json(user);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Update user
// @route   PUT /users/:id
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
	body("password")
		.optional()
		.trim()
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),
	body("confirmPassword")
		.optional()
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
			return res.status(400).json({ errors: errors.array() });
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
			const posts = await Post.find({ author: req.params.id });
			res.json(posts);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);
