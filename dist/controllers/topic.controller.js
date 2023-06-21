"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPopularTopics = exports.deleteTopic = exports.updateTopic = exports.createTopic = exports.getPostsByTopic = exports.getTopicById = exports.getTopics = void 0;
const express_validator_1 = require("express-validator");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const passport_1 = __importDefault(require("passport"));
const topic_model_1 = __importDefault(require("../models/topic.model"));
const post_model_1 = __importDefault(require("../models/post.model"));
const mongoose_1 = require("mongoose");
const calculateStartTime_1 = require("../utils/calculateStartTime");
exports.getTopics = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const topicsQuery = topic_model_1.default.find();
        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            topicsQuery.limit(limit);
        }
        const topics = await topicsQuery.exec();
        if (topics.length === 0) {
            res.status(404).json({ message: "No topics found" });
            return;
        }
        res.status(200).json(topics);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getTopicById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const topic = await topic_model_1.default.findById(req.params.id);
        if (!topic) {
            res.status(404).json({ message: "Topic not found" });
            return;
        }
        res.status(200).json(topic);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPostsByTopic = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        let limit = 100;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        const start = (0, calculateStartTime_1.calculateStartTime)(req.query.timeRange);
        const topic = await topic_model_1.default.findById(req.params.id);
        if (!topic) {
            res.status(404).json({ message: "Topic not found" });
            return;
        }
        const match = {
            topic: new mongoose_1.Types.ObjectId(req.params.id),
            published: true,
        };
        const postsCount = await post_model_1.default.countDocuments(match);
        let postsQuery = post_model_1.default.aggregate([
            {
                $match: match,
            },
            {
                $addFields: {
                    numberOfLikesFiltered: {
                        $filter: {
                            input: "$likes",
                            as: "like",
                            cond: { $gte: ["$$like.date", start] },
                        },
                    },
                },
            },
            {
                $sort: { numberOfLikesFiltered: -1, createdAt: -1 },
            },
            {
                $limit: limit,
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
                $project: {
                    _id: 1,
                    createdAt: 1,
                    likes: 1,
                    comments: 1,
                    tags: 1,
                    content: 1,
                    title: 1,
                    author: {
                        _id: "$author._id",
                        firstName: "$author.firstName",
                        lastName: "$author.lastName",
                    },
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
        if (posts.length === 0) {
            res.status(404).json({ message: "No posts found" });
            return;
        }
        res.status(200).json({ posts, topic, meta: { total: postsCount } });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createTopic = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.body)("name")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Topic name must be at least 1 character long"),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        if (user?.userType !== "admin") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        try {
            const { name } = req.body;
            const topic = new topic_model_1.default({ name });
            await topic.save();
            res.status(201).json(topic);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.updateTopic = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.body)("name")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Topic name must be at least 1 character long"),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        if (user?.userType !== "admin") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        try {
            const { name } = req.body;
            const topic = await topic_model_1.default.findByIdAndUpdate(req.params.id, { name }, { new: true });
            res.status(201).json(topic);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.deleteTopic = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ message: "User not logged in" });
                return;
            }
            if (user?.userType !== "admin") {
                res.status(403).json({ message: "Unauthorized" });
                return;
            }
            const topic = await topic_model_1.default.findByIdAndDelete(req.params.id);
            if (!topic) {
                res.status(404).json({ message: "Topic not found" });
                return;
            }
            res.status(200).json(topic);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.getPopularTopics = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        let limit = 10;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        let sortBy = "totalPosts";
        if (req.query.sortBy) {
            sortBy = req.query.sortBy;
        }
        const topics = await topic_model_1.default.aggregate([
            {
                $lookup: {
                    from: "posts",
                    let: { topicId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$$topicId", "$topic"],
                                },
                            },
                        },
                        {
                            $unwind: {
                                path: "$likes",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $group: {
                                _id: "$topic",
                                totalPosts: { $sum: 1 },
                                totalLikes: {
                                    $sum: { $cond: [{ $ifNull: ["$likes", false] }, 1, 0] },
                                },
                            },
                        },
                    ],
                    as: "postDetails",
                },
            },
            { $unwind: { path: "$postDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    totalPosts: { $ifNull: ["$postDetails.totalPosts", 0] },
                    totalLikes: { $ifNull: ["$postDetails.totalLikes", 0] },
                },
            },
            {
                $sort: { [sortBy]: -1, _id: 1 },
            },
            {
                $limit: limit,
            },
        ]);
        if (!topics) {
            res.status(404).json({ message: "No topics found" });
            return;
        }
        res.status(200).json(topics);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
//# sourceMappingURL=topic.controller.js.map