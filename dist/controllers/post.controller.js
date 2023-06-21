"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSavedPost = exports.getFollowingPosts = exports.getPopularPosts = exports.getLikes = exports.unlikePost = exports.likePost = exports.deletePost = exports.updatePost = exports.createPost = exports.getPostById = exports.getPostsPreview = exports.getPosts = void 0;
const express_validator_1 = require("express-validator");
const post_model_1 = __importDefault(require("../models/post.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const passport_1 = __importDefault(require("passport"));
const calculateStartTime_1 = require("../utils/calculateStartTime");
const mongoose_1 = require("mongoose");
exports.getPosts = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const match = { published: true };
        const postsCount = await post_model_1.default.countDocuments(match);
        const postsQuery = post_model_1.default.find(match)
            .populate("author", "firstName lastName isDeleted")
            .populate("topic", "name")
            .sort({ createdAt: -1 });
        if (req.query.offset) {
            const offset = parseInt(req.query.offset);
            postsQuery.skip(offset);
        }
        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            postsQuery.limit(limit);
        }
        const posts = await postsQuery.exec();
        res.status(200).json({ posts, meta: { total: postsCount } });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPostsPreview = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ message: "No user logged in" });
                return;
            }
            if (user.userType !== "admin") {
                res.status(403).json({ message: "Unauthorized" });
                return;
            }
            const postsCount = await post_model_1.default.countDocuments({});
            const posts = await post_model_1.default.find({}, { title: 1, updatedAt: 1, likes: 1, comments: 1 })
                .populate("author", "firstName lastName isDeleted")
                .populate("topic", "name")
                .sort({ createdAt: -1 });
            res.status(200).json({ posts, meta: { total: postsCount } });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.getPostById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const post = await post_model_1.default.findById(req.params.id)
            .populate("author", "firstName lastName description followers isDeleted avatarUrl")
            .populate("likes", "email")
            .populate("topic", "name")
            .populate({
            path: "comments",
            populate: {
                path: "author",
                select: "firstName lastName isDeleted avatarUrl",
            },
        });
        res.status(200).json(post);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createPost = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.body)("title")
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage("Title must be at least 5 and less than 100 characters long"),
    (0, express_validator_1.body)("content")
        .trim()
        .isLength({ min: 250, max: 10000 })
        .withMessage("Title must be at least 250 and less than 10000 characters long"),
    (0, express_validator_1.body)("topic").isMongoId().withMessage("Topic must be an ObjectId"),
    (0, express_validator_1.body)("published")
        .notEmpty()
        .isBoolean()
        .withMessage("Published must be a boolean"),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const author = req.user;
        if (!author) {
            res.status(401).json({ message: "Author is required" });
            return;
        }
        const { title, content, topic, published } = req.body;
        try {
            const post = new post_model_1.default({
                title,
                content,
                topic,
                author,
                published,
            });
            await post.save();
            res.status(201).json(post);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.updatePost = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.body)("title")
        .optional()
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage("Title must be at least 5 and less than 100 characters long"),
    (0, express_validator_1.body)("content")
        .optional()
        .trim()
        .isLength({ min: 250, max: 10000 })
        .withMessage("Content must be at least 250 and less than 10000 characters long"),
    (0, express_validator_1.body)("topic").optional().isMongoId().withMessage("Topic must be an ObjectId"),
    (0, express_validator_1.body)("published")
        .optional()
        .isBoolean()
        .withMessage("Published must be a boolean"),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { title, content, topic, published } = req.body;
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ message: "No user logged in" });
                return;
            }
            const post = await post_model_1.default.findById(req.params.id);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            if (post.author.toString() !== user.id && user.userType !== "admin") {
                res.status(403).json({
                    message: "Only admin and the original author can update post",
                });
                return;
            }
            post.title = title;
            post.content = content;
            post.topic = topic;
            post.published = published;
            const updatedPost = await post.save();
            res.status(201).json(updatedPost);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.deletePost = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ message: "No user logged in" });
                return;
            }
            const post = await post_model_1.default.findById(req.params.id);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            if (post.author.toString() !== user.id && user.userType !== "admin") {
                res.status(403).json({ message: "Unauthorized" });
                return;
            }
            const result = await post_model_1.default.findByIdAndDelete(req.params.id);
            if (!result) {
                res.status(404).json({ message: "Delete failed" });
                return;
            }
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.likePost = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        try {
            const postId = req.params.id;
            const post = await post_model_1.default.findById(postId);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            const hasLiked = post.likes.some((like) => like.userId.toString() === user._id.toString());
            if (hasLiked) {
                res.status(400).json({ message: "You have already liked this post" });
                return;
            }
            post.likes.push({ userId: user._id, date: new Date() });
            const updatedPost = await post.save();
            res.status(201).json(updatedPost);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.unlikePost = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        try {
            const postId = req.params.id;
            const post = await post_model_1.default.findById(postId);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            const hasLiked = post.likes.some((like) => like.userId.toString() === user._id.toString());
            if (!hasLiked) {
                res.status(400).json({ message: "You have not liked this post yet" });
                return;
            }
            post.likes = post.likes.filter((like) => like.userId.toString() !== user._id.toString());
            const updatedPost = await post.save();
            res.status(201).json(updatedPost);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.getLikes = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const post = await post_model_1.default.findById(req.params.id).select("likes");
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        res.status(200).json(post.likes.length);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPopularPosts = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const start = (0, calculateStartTime_1.calculateStartTime)(req.query.timeRange);
        const postsCount = await post_model_1.default.countDocuments({ published: true });
        let postsQuery = post_model_1.default.aggregate([
            {
                $match: {
                    published: true,
                },
            },
            {
                $addFields: {
                    filteredLikes: {
                        $filter: {
                            input: "$likes",
                            as: "like",
                            cond: { $gte: ["$$like.date", start] },
                        },
                    },
                },
            },
            {
                $addFields: {
                    likeCount: { $size: "$filteredLikes" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "author",
                    foreignField: "_id",
                    as: "author",
                },
            },
            {
                $unwind: {
                    path: "$author",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "topics",
                    localField: "topic",
                    foreignField: "_id",
                    as: "topic",
                },
            },
            {
                $unwind: {
                    path: "$topic",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $sort: {
                    likeCount: -1,
                },
            },
        ]);
        if (req.query.offset) {
            const offset = parseInt(req.query.offset);
            postsQuery = postsQuery.skip(offset);
        }
        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            postsQuery = postsQuery.limit(limit);
        }
        const posts = await postsQuery.exec();
        res.status(200).json({ posts, meta: { total: postsCount } });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});
exports.getFollowingPosts = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        try {
            const match = {
                published: true,
                author: { $in: user.following },
            };
            const postsCount = await post_model_1.default.countDocuments(match);
            const postsQuery = post_model_1.default.find(match)
                .populate("author", "firstName lastName isDeleted")
                .populate("topic", "name")
                .sort({ createdAt: -1 });
            if (req.query.offset) {
                const offset = parseInt(req.query.offset);
                postsQuery.skip(offset);
            }
            if (req.query.limit) {
                const limit = parseInt(req.query.limit);
                postsQuery.limit(limit);
            }
            const posts = await postsQuery.exec();
            if (!posts) {
                res.status(404).json({ message: "No posts found" });
                return;
            }
            res.status(200).json({ posts, meta: { total: postsCount } });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server Error" });
        }
    }),
];
exports.toggleSavedPost = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        try {
            const userId = user._id;
            const postId = new mongoose_1.Types.ObjectId(req.params.id);
            const isPostSaved = user.savedPosts.includes(postId);
            const updateOperation = isPostSaved
                ? { $pull: { savedPosts: req.params.id } }
                : { $addToSet: { savedPosts: req.params.id } };
            const userUpdated = await user_model_1.default.findByIdAndUpdate(userId, updateOperation, { new: true });
            res.status(200).json({ userUpdated });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
//# sourceMappingURL=post.controller.js.map