/* eslint-disable @typescript-eslint/no-explicit-any */
import expressAsyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import User, { IUser } from "../models/user.model";
import passport from "passport";
import jwt from "jsonwebtoken";

const handleUserLogin = (res: Response, user: IUser) => {
	const payload = {
		id: user._id,
	};

	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) throw new Error("JWT Secret not defined");

	const token = jwt.sign(payload, jwtSecret, {
		expiresIn: "1h",
	});

	// TODO secure: true for production
	res.locals.user = user;
	res.cookie("jwt", token, {
		maxAge: 3600000,
		httpOnly: true,
		secure: true,
		sameSite: "none",
	});

	res.status(200).json({
		message: "Logged in successfully.",
		user,
		token,
	});
};

// @desc    Register a new user
// @route   POST /signup
// @access  Public
export const postSignUp = [
	body("firstName").notEmpty().trim(),
	body("lastName").notEmpty().trim(),
	body("email").notEmpty().trim().isEmail().normalizeEmail(),
	body("username").notEmpty().trim().isLength({ min: 5 }),
	body("password").notEmpty().trim().isLength({ min: 8 }),
	body("confirmPassword")
		.notEmpty()
		.trim()
		.custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error("Passwords do not match");
			}
			return true;
		}),
	expressAsyncHandler(
		async (req: Request, res: Response, next: NextFunction): Promise<any> => {
			try {
				const errors = validationResult(req);
				if (!errors.isEmpty())
					return res.status(400).json({ errors: errors.array() });

				const { firstName, lastName, email, username } = req.body;

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
				});
				const result = await user.save();
				if (!result) throw new Error("Could not save user");

				handleUserLogin(res, user);
			} catch (err) {
				return next(err);
			}
		},
	),
];

// @desc    Log in a user
// @route   POST /login
// @access  Public
export const postLogin = [
	body("username").notEmpty().trim(),
	body("password").notEmpty().trim(),
	expressAsyncHandler(
		async (req: Request, res: Response, next: NextFunction): Promise<any> => {
			const errors = validationResult(req);

			if (!errors.isEmpty())
				return res.status(400).json({ errors: errors.array() });

			passport.authenticate(
				"local",
				{ session: false },
				function (err: Error, user: IUser) {
					if (err) return next(err);

					if (!user)
						return res.status(404).json({ emailNotFound: "Email not found" });

					req.logIn(user, (err) => {
						if (err) return next(err);

						handleUserLogin(res, user);
					});
				},
			)(req, res, next);
		},
	),
];

// @desc    Log out a user
// @route   POST /logout
// @access  Public
export const postLogout = (req: Request, res: Response, next: NextFunction) => {
	res.clearCookie("jwt");

	req.logout((err) => {
		if (err) return next(err);
		res.status(200).json({ message: "User logged out successfully" });
	});
};
