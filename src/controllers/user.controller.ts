/* eslint-disable @typescript-eslint/no-explicit-any */
import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import expressAsyncHandler from "express-async-handler";

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
			const user = await User.findById(req.params.id);
			res.json(user);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create user
// @route   POST /users
// @access  Public
// TODO server side password validation
export const createUser = [
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
// TODO server side password validation
export const updateUser = [
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
export const deleteUser = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			const user: IUser | null = await User.findByIdAndDelete(req.params.id);
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}
			res.json(user);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Search users by specific field
// @route   GET /users/search?field=value
// @access  Public
// TOFO implement search
export const searchUsers = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			const query = req.query;
			res.json(query);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// TODO AUTHENTICATION
// @desc    Login user
// @route   POST /users/login
// @access  Public
export const loginUser = [
	body("email").trim().isEmail().withMessage("Email must be valid"),
	body("password")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			res.json({ message: "login" });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Register user
// @route   POST /users/register
// @access  Public

// @desc    Logout user
// @route   POST /users/logout
// @access  Private
