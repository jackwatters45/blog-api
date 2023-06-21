"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentReply = exports.dislikeComment = exports.likeComment = exports.deleteComment = exports.updateComment = exports.createComment = exports.getCommentById = exports.getReplies = exports.getComments = void 0;
const express_validator_1 = require("express-validator");
const comment_model_1 = __importDefault(require("../models/comment.model"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const passport_1 = __importDefault(require("passport"));
const post_model_1 = __importDefault(require("../models/post.model"));
const mongoose_1 = require("mongoose");
exports.getComments = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { post } = req.params;
        const commentsCount = await comment_model_1.default.countDocuments({ post });
        const parentCommentsCount = await comment_model_1.default.countDocuments({
            post,
            parentComment: null,
        });
        const commentsQuery = comment_model_1.default.find({
            post,
            parentComment: null,
        });
        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            commentsQuery.limit(limit);
        }
        if (req.query.offset) {
            const offset = parseInt(req.query.offset);
            commentsQuery.skip(offset);
        }
        if (req.query.sortBy) {
            const sort = req.query.sortBy;
            if (sort === "likes") {
                commentsQuery.sort({ likes: -1, updatedAt: -1 });
            }
            else if (sort === "dislikes") {
                commentsQuery.sort({ dislikes: -1, updatedAt: -1 });
            }
            else if (sort === "newest") {
                commentsQuery.sort({ updatedAt: -1 });
            }
            else if (sort === "replies") {
                commentsQuery.sort({ replies: -1, updatedAt: -1 });
            }
            else {
                commentsQuery.sort({ [sort]: -1 });
            }
        }
        const comments = await commentsQuery.exec();
        res.status(200).json({
            comments,
            meta: { total: commentsCount, totalParent: parentCommentsCount },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getReplies = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { limit = 3, offset = 0 } = req.query;
        const replies = await comment_model_1.default.find({ parentComment: req.params.id })
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getCommentById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const comment = await comment_model_1.default.findById(req.params.id);
        res.status(200).json(comment);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createComment = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.body)("content")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Content must be at least 1 character long"),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        const authorId = user._id;
        const { post } = req.params;
        const { content } = req.body;
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const comment = new comment_model_1.default({
                content,
                author: authorId,
                post,
                likes: [],
                replies: [],
                isDeleted: false,
                parentComment: null,
            });
            const newComment = await comment.save();
            await post_model_1.default.findByIdAndUpdate(post, {
                $push: { comments: newComment._id },
            }, { new: true, session });
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
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.updateComment = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.body)("content")
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage("Content must be at least 1 character long"),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        try {
            const comment = await comment_model_1.default.findById(req.params.id);
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
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.deleteComment = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        try {
            const comment = await comment_model_1.default.findById(req.params.id);
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
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.likeComment = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        try {
            const comment = await comment_model_1.default.findById(req.params.id);
            if (!comment) {
                res.status(404).json({ message: "Comment not found" });
                return;
            }
            const index = comment.likes.findIndex((id) => id.equals(user._id));
            if (index !== -1) {
                comment.likes.splice(index, 1);
            }
            else {
                comment.likes.push(user._id);
            }
            const dislikesIndex = comment.dislikes.findIndex((id) => id.equals(user._id));
            if (dislikesIndex !== -1) {
                comment.dislikes.splice(dislikesIndex, 1);
            }
            await comment.save();
            res.status(200).json({
                message: "Comment liked successfully",
                updatedLikes: comment.likes,
                updatedDislikes: comment.dislikes,
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.dislikeComment = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        try {
            const comment = await comment_model_1.default.findById(req.params.id);
            if (!comment) {
                res.status(404).json({ message: "Comment not found" });
                return;
            }
            const index = comment.dislikes.findIndex((id) => id.equals(user._id));
            if (index !== -1) {
                comment.dislikes.splice(index, 1);
            }
            else {
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
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.createCommentReply = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.body)("content")
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage("Content must be between 1 and 500 characters long"),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const comment = await comment_model_1.default.findById(req.params.id);
            if (!comment) {
                res.status(404).json({ message: "Comment not found" });
                return;
            }
            const { post, _id } = comment;
            const newComment = new comment_model_1.default({
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
            await post_model_1.default.findByIdAndUpdate(post, {
                $push: { comments: newComment._id },
            }, { new: true, session });
            await session.commitTransaction();
            session.endSession();
            res.status(201).json({ newComment });
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({ message: error.message });
        }
    }),
];
//# sourceMappingURL=comment.controller.js.map