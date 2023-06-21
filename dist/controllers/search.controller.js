"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchTopics = exports.searchUsersAdmin = exports.searchUsers = exports.searchMyPosts = exports.searchPosts = exports.searchAll = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
const post_model_1 = __importDefault(require("../models/post.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const topic_model_1 = __importDefault(require("../models/topic.model"));
const passport_1 = __importDefault(require("passport"));
exports.searchAll = [
    (0, express_validator_1.check)("q").isLength({ min: 1, max: 50 }).trim().escape(),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        if (!req.query.q) {
            res.status(400).json({ message: "Search query is required" });
            return;
        }
        try {
            const search = req.query.q;
            const posts = await post_model_1.default.find({ $text: { $search: search } }, { score: { $meta: "textScore" } })
                .populate({ path: "author", select: "firstName lastName isDeleted" })
                .populate({ path: "topic", select: "name" })
                .sort({ score: { $meta: "textScore" } });
            const users = await user_model_1.default.aggregate([
                {
                    $match: {
                        $text: { $search: search },
                        isDeleted: false,
                    },
                },
                {
                    $addFields: {
                        score: { $meta: "textScore" },
                    },
                },
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
                    },
                },
                {
                    $sort: { score: { $meta: "textScore" } },
                },
            ]);
            user_model_1.default.find({
                isDeleted: false,
                $text: { $search: search },
            }, { score: { $meta: "textScore" } })
                .select({ password: 0, email: 0 })
                .sort({ score: { $meta: "textScore" } });
            const topics = await topic_model_1.default.find({ $text: { $search: req.query.q } }, { score: { $meta: "textScore" } });
            res.status(200).json({ posts, users, topics });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.searchPosts = [
    (0, express_validator_1.check)("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty() && req.query.q) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            let postsQuery;
            if (req.query.q) {
                postsQuery = post_model_1.default.find({ $text: { $search: req.query.q } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
            }
            else {
                postsQuery = post_model_1.default.find().sort({ createdAt: -1 });
            }
            const posts = await postsQuery
                .populate({ path: "author", select: "firstName lastName isDeleted" })
                .populate({ path: "topic", select: "name" });
            res.status(200).json(posts);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.searchMyPosts = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.check)("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty() && req.query.q) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        try {
            let postsQuery;
            if (req.query.q) {
                postsQuery = post_model_1.default.find({ author: user._id, $text: { $search: req.query.q } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
            }
            else {
                postsQuery = post_model_1.default.find({ author: user._id }).sort({ createdAt: -1 });
            }
            const posts = await postsQuery
                .populate({ path: "author", select: "firstName lastName isDeleted" })
                .populate({ path: "topic", select: "name" });
            res.status(200).json(posts);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.searchUsers = [
    (0, express_validator_1.check)("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty() && req.query.q) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            let usersQuery;
            if (req.query.q) {
                usersQuery = user_model_1.default.find({
                    $text: { $search: req.query.q },
                    isDeleted: false,
                }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
            }
            else {
                usersQuery = user_model_1.default.find({ isDeleted: false }).sort({ createdAt: -1 });
            }
            const users = await usersQuery.select({ password: 0, email: 0 });
            res.status(200).json(users);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.searchUsersAdmin = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.check)("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty() && req.query.q) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        if (user?.userType !== "admin") {
            res
                .status(403)
                .json({ message: "You are not authorized to perform this action" });
            return;
        }
        try {
            let usersQuery;
            if (req.query.q) {
                usersQuery = user_model_1.default.aggregate([
                    {
                        $match: {
                            $text: { $search: req.query.q },
                        },
                    },
                    {
                        $addFields: {
                            score: { $meta: "textScore" },
                        },
                    },
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
                            deletedData: 1,
                            isDeleted: 1,
                            score: 1,
                        },
                    },
                    {
                        $sort: { score: { $meta: "textScore" } },
                    },
                ]);
            }
            else {
                usersQuery = user_model_1.default.aggregate([
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
                    {
                        $sort: { createdAt: -1 },
                    },
                ]);
            }
            const users = await usersQuery;
            res.status(200).json(users);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.searchTopics = [
    (0, express_validator_1.check)("q").optional().isLength({ min: 1, max: 50 }).trim().escape(),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty() && req.query.q) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            const topics = await topic_model_1.default.find({ $text: { $search: req.query.q } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
            res.status(200).json(topics);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
//# sourceMappingURL=search.controller.js.map