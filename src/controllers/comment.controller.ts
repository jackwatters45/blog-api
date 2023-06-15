import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Comment from "../models/comment.model";
import expressAsyncHandler from "express-async-handler";
import passport from "passport";
import { IUser } from "../models/user.model";
import Post from "../models/post.model";
import { startSession } from "mongoose";

// @desc    Get all comments
// @route   GET /comments
// @access  Public
export const getComments = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const commentsQuery = Comment.find().populate(
				"author",
				"firstName lastName",
			);

			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				commentsQuery.limit(limit);
			}

			const comments = await commentsQuery.exec();
			res.status(200).json(comments);
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
			res.status(200).json(comment);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create comment
// @route   POST /posts/:id/comments
// @access  Private
export const createComment = [
	passport.authenticate("jwt", { session: false }),
	body("content")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Content must be at least 1 character long"),

	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const user = req.user as IUser;

		if (!user) {
			res.status(401).json({ message: "No user logged in" });
			return;
		}

		const author = user._id;
		const { post } = req.params;
		const { content } = req.body;

		const session = await startSession();
		session.startTransaction();

		try {
			const comment = new Comment({
				content,
				author,
				post,
			});

			const newComment = await comment.save();

			await Post.findByIdAndUpdate(
				post,
				{
					$push: { comments: newComment._id },
				},
				{ new: true, session },
			);

			await session.commitTransaction();
			session.endSession();

			res.status(201).json(newComment);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();

			res.status(500).json({ message: error.message });
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

	expressAsyncHandler(async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const user = req.user as IUser;
		if (!user) {
			res.status(401).json({ message: "No user logged in" });
			return;
		}

		try {
			const comment = await Comment.findById(req.params.id);

			if (!comment) {
				res.status(404).json({ message: "Comment not found" });
				return;
			}

			if (comment.author.toString() !== user._id.toString()) {
				res
					.status(403)
					.json({
						message: "You must be the original commenter to edit a comment",
					});
				return;
			}

			comment.content = req.body.content;
			await comment.save();

			res.status(201).json(comment);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Delete comment
// @route   DELETE /comments/:id
// @access  Private
export const deleteComment = [
	passport.authenticate("jwt", { session: false }),
	expressAsyncHandler(async (req: Request, res: Response) => {
		const user = req.user as IUser;

		if (!user) {
			res.status(401).json({ message: "No user logged in" });
			return;
		}

		try {
			const comment = await Comment.findById(req.params.id);

			if (!comment) {
				res.status(404).json({ message: "Comment not found" });
				return;
			}

			if (comment.author.toString() !== user._id.toString()) {
				res.status(403).json({ message: "Not authorized" });
				return;
			}

			await Comment.findByIdAndDelete(req.params.id);

			res.status(200).json({ message: "Comment deleted successfully" });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Get comments by post id
// @route   GET posts/:id/comments
// @access  Public
export const getCommentsByPostId = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const comments = await Comment.find({
				post: req.params.id,
			}).populate("author", "firstName lastName");

			res.status(200).json(comments);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);
