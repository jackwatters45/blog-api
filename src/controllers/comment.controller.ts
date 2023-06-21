import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Comment from "../models/comment.model";
import expressAsyncHandler from "express-async-handler";
import passport from "passport";
import { IUser } from "../models/user.model";
import Post from "../models/post.model";
import { startSession } from "mongoose";

// @desc    Get all comments from post
// @route   GET /posts/:post/comments
// @access  Public
export const getComments = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const { post } = req.params;

			const commentsCount = await Comment.countDocuments({ post });
			const parentCommentsCount = await Comment.countDocuments({
				post,
				parentComment: null,
			});
			const commentsQuery = Comment.find({
				post,
				parentComment: null,
			});

			if (req.query.limit) {
				const limit = parseInt(req.query.limit as string);
				commentsQuery.limit(limit);
			}

			if (req.query.offset) {
				const offset = parseInt(req.query.offset as string);
				commentsQuery.skip(offset);
			}

			if (req.query.sortBy) {
				const sort = req.query.sortBy as string;
				if (sort === "likes") {
					commentsQuery.sort({ likes: -1, updatedAt: -1 });
				} else if (sort === "dislikes") {
					commentsQuery.sort({ dislikes: -1, updatedAt: -1 });
				} else if (sort === "newest") {
					commentsQuery.sort({ updatedAt: -1 });
				} else if (sort === "replies") {
					commentsQuery.sort({ replies: -1, updatedAt: -1 });
				} else {
					commentsQuery.sort({ [sort]: -1 });
				}
			}

			const comments = await commentsQuery.exec();

			res.status(200).json({
				comments,
				meta: { total: commentsCount, totalParent: parentCommentsCount },
			});
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get replies from comment
// @route   GET /posts/:post/comments/:id/replies
// @access  Public
export const getReplies = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const { limit = 3, offset = 0 } = req.query;

			const replies = await Comment.find({ parentComment: req.params.id })
				.sort({ updatedAt: -1 })
				.skip(Number(offset))
				.limit(Number(limit))
				.populate("author", "firstName lastName avatarUrl isDeleted")
				.exec();

			if (!replies) {
				res.status(404).json({ message: "Replies not found." });
				return;
			}

			console.log(replies);

			res.status(200).json({ replies });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Get comment by id
// @route   GET /posts/:post/comments/:id
// @access  Public
export const getCommentById = expressAsyncHandler(
	async (req: Request, res: Response) => {
		try {
			const comment = await Comment.findById(req.params.id);

			res.status(200).json(comment);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
);

// @desc    Create comment
// @route   POST /posts/:post/comments
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

		const authorId = user._id;
		const { post } = req.params;
		const { content } = req.body;

		const session = await startSession();
		session.startTransaction();

		try {
			const comment = new Comment({
				content,
				author: authorId,
				post,
				likes: [],
				replies: [],
				isDeleted: false,
				parentComment: null,
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

			const author = {
				firstName: user.firstName,
				lastName: user.lastName,
				_id: user._id,
				avatarUrl: user.avatarUrl,
			};

			const commentWithAuthor = {
				content,
				post,
				_id: newComment._id,
				createdAt: new Date(),
				updatedAt: new Date(),
				likes: [],
				replies: [],
				isDeleted: false,
				parentComment: null,
				author,
			};

			res.status(201).json(commentWithAuthor);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();

			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Update comment
// @route   PATCH posts/:post/comments/:id
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
				res.status(403).json({
					message: "You must be the original commenter to edit a comment",
				});
				return;
			}

			comment.content = req.body.content;
			await comment.save();

			res.status(201).json({ message: "Comment updated" });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Delete comment
// @route   DELETE posts/:post/comments/:id
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

			comment.content = "[deleted]";
			comment.isDeleted = true;
			await comment.save();

			const changes = {
				content: comment.content,
				isDeleted: comment.isDeleted,
			};

			res.status(200).json({
				message: "Comment deleted successfully",
				updatedComment: changes,
			});
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Like comment
// @route   POST posts/:post/comments/:id/like
// @access  Private
export const likeComment = [
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

			const index = comment.likes.findIndex((id) => id.equals(user._id));
			if (index !== -1) {
				comment.likes.splice(index, 1);
			} else {
				comment.likes.push(user._id);
			}

			const dislikesIndex = comment.dislikes.findIndex((id) =>
				id.equals(user._id),
			);
			if (dislikesIndex !== -1) {
				comment.dislikes.splice(dislikesIndex, 1);
			}

			await comment.save();

			res.status(200).json({
				message: "Comment liked successfully",
				updatedLikes: comment.likes,
				updatedDislikes: comment.dislikes,
			});
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    Dislike comment
// @route   POST posts/:post/comments/:id/dislike
// @access  Private
export const dislikeComment = [
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

			const index = comment.dislikes.findIndex((id) => id.equals(user._id));

			if (index !== -1) {
				comment.dislikes.splice(index, 1);
			} else {
				comment.dislikes.push(user._id);
			}

			const likesIndex = comment.likes.findIndex((id) => id.equals(user._id));
			if (likesIndex !== -1) {
				comment.likes.splice(likesIndex, 1);
			}

			await comment.save();

			res.status(200).json({
				message: "Comment disliked successfully",
				updatedLikes: comment.likes,
				updatedDislikes: comment.dislikes,
			});
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
];

// @desc    create comment reply
// @route   POST posts/:post/comments/:id/reply
// @access  Private
export const createCommentReply = [
	passport.authenticate("jwt", { session: false }),
	body("content")
		.trim()
		.isLength({ min: 1, max: 500 })
		.withMessage("Content must be between 1 and 500 characters long"),
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

		const session = await startSession();
		session.startTransaction();

		try {
			const comment = await Comment.findById(req.params.id);

			if (!comment) {
				res.status(404).json({ message: "Comment not found" });
				return;
			}

			const { post, _id } = comment;
			const newComment = new Comment({
				content: req.body.content,
				post: post,
				author: user._id,
				likes: [],
				replies: [],
				isDeleted: false,
				parentComment: _id,
			});

			await newComment.save();

			comment.replies.push(newComment._id);
			await comment.save();

			await Post.findByIdAndUpdate(
				post,
				{
					$push: { comments: newComment._id },
				},
				{ new: true, session },
			);

			await session.commitTransaction();
			session.endSession();

			res.status(201).json({ newComment });
		} catch (error) {
			await session.abortTransaction();
			session.endSession();

			res.status(500).json({ message: error.message });
		}
	}),
];
