/* eslint-disable @typescript-eslint/no-explicit-any */
import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Comment from "../models/comment.model";
import expressAsyncHandler from "express-async-handler";
import passport from "passport";
import { IUser } from "../models/user.model";

// @desc    Get all comments
// @route   GET /comments
// @access  Public
export const getComments = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const comments = await Comment.find().populate(
				"author",
				"firstName lastName",
			);
			res.status(201).json(comments);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get comment by id
// @route   GET /comments/:id
// @access  Public
export const getCommentById = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const comment = await Comment.findById(req.params.id).populate(
				"author",
				"firstName lastName",
			);
			res.status(201).json(comment);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create comment
// @route   POST /comments
// @access  Private
// TODO change author setup to use req.user once authentication is implemented
export const createComment = [
	passport.authenticate("jwt", { session: false }),
	body("content")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Content must be at least 1 character long"),

	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		console.log(req.user);

		const user = req.user as IUser;

		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const author = user._id;
		const { content, post } = req.body;

		try {
			const comment = new Comment({
				content,
				author,
				post,
			});

			const newComment = await comment.save();
			res.status(201).status(201).json(newComment);
		} catch (error) {
			res.status(400).json({ message: error.message });
		}
	}),
];

// @desc    Update comment
// @route   PATCH /comments/:id
// @access  Private
export const updateComment = [
	passport.authenticate("jwt", { session: false }),
	body("content")
		.optional()
		.trim()
		.isLength({ min: 1 })
		.withMessage("Content must be at least 1 character long"),

	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const { content } = req.body;
			const comment = await Comment.findByIdAndUpdate(
				req.params.id,
				{ content },
				{ new: true },
			);

			res.status(201).json(comment);
		} catch (error) {
			res.status(400).json({ message: error.message });
		}
	}),
];

// @desc    Delete comment
// @route   DELETE /comments/:id
// @access  Private
export const deleteComment = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		try {
			const comment = await Comment.findByIdAndDelete(req.params.id);

			if (!comment) {
				return res.status(404).json({ message: "Comment not found" });
			}

			res.status(201).json(comment);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Get comments by post id
// @route   GET posts/:id/comments
// @access  Private
export const getCommentsByPostId = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const comments = await Comment.find({
				post: req.params.id,
			}).populate("author", "firstName lastName");

			res.status(201).json(comments);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);
