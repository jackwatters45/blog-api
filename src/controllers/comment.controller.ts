/* eslint-disable @typescript-eslint/no-explicit-any */
import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Comment from "../models/comment";
import expressAsyncHandler from "express-async-handler";

// @desc    Get all comments
// @route   GET /comments
// @access  Public
export const getComments = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const comments = await Comment.find();
			res.json(comments);
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
			const comment = await Comment.findById(req.params.id);
			res.json(comment);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create comment
// @route   POST /comments
// @access  Public
export const createComment = [
	body("content")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Content must be at least 1 character long"),

	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { content, author } = req.body;

		try {
			const comment = new Comment({
				content,
				author,
			});

			const newComment = await comment.save();
			res.status(201).json(newComment);
		} catch (error) {
			res.status(400).json({ message: error.message });
		}
	}),
];

// @desc    Update comment
// @route   PATCH /comments/:id
// @access  Public
export const updateComment = [
	body("content")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Content must be at least 1 character long"),

	expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const comment = await Comment.findById(req.params.id);

			if (!comment) {
				return res.status(404).json({ message: "Comment not found" });
			}

			const { content } = req.body;

			comment.content = content;

			const updatedComment = await comment.save();
			res.json(updatedComment);
		} catch (error) {
			res.status(400).json({ message: error.message });
		}
	}),
];

// @desc    Delete comment
// @route   DELETE /comments/:id
// @access  Public
export const deleteComment = expressAsyncHandler(
	async (req: Request, res: Response): Promise<any> => {
		try {
			const comment = await Comment.findById(req.params.id);

			if (!comment) {
				return res.status(404).json({ message: "Comment not found" });
			}

			// await comment.remove();
			res.json({ message: "Comment deleted" });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);
