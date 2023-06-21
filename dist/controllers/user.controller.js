"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedPosts = exports.removeFollower = exports.addFollower = exports.getUserFollowing = exports.getPopularAuthors = exports.getUserPosts = exports.deleteUser = exports.updateUser = exports.updateUserPassword = exports.createUser = exports.getDeletedUserById = exports.getUserById = exports.getUsersPreviewData = exports.getUsers = void 0;
const express_validator_1 = require("express-validator");
const user_model_1 = __importDefault(require("../models/user.model"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const post_model_1 = __importDefault(require("../models/post.model"));
const comment_model_1 = __importDefault(require("../models/comment.model"));
const passport_1 = __importDefault(require("passport"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const calculateStartTime_1 = require("../utils/calculateStartTime");
const uuid_1 = require("uuid");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const uploadToCloudinary_1 = __importDefault(require("../utils/uploadToCloudinary"));
const resizeImage_1 = __importDefault(require("../utils/resizeImage"));
const upload = (0, multer_1.default)();
exports.getUsers = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const usersQuery = user_model_1.default.find({ isDeleted: false }, { password: 0 });
        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            usersQuery.limit(limit);
        }
        const users = await usersQuery.exec();
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getUsersPreviewData = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        if (user.userType !== "admin") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        try {
            const usersCount = await user_model_1.default.countDocuments();
            const usersQuery = user_model_1.default.aggregate([
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
            ]).sort({ createdAt: -1 });
            if (req.query.offset) {
                const offset = parseInt(req.query.offset);
                usersQuery.skip(offset);
            }
            if (req.query.limit) {
                const limit = parseInt(req.query.limit);
                usersQuery.limit(limit);
            }
            const users = await usersQuery.exec();
            res.status(200).json({ users, meta: { total: usersCount } });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.getUserById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const [user, posts, comments] = await Promise.all([
            user_model_1.default.findById(req.params.id, { password: 0 }).populate({
                path: "following",
                options: { limit },
            }),
            post_model_1.default.find({ published: true, author: req.params.id }).populate({
                path: "topic",
            }),
            comment_model_1.default.find({ author: req.params.id }).populate({
                path: "post",
                select: "title",
                populate: {
                    path: "author",
                    select: "firstName lastName",
                },
            }),
        ]);
        if (user?.isDeleted) {
            res
                .status(403)
                .json({ isDeleted: true, message: "This user has been deleted." });
            return;
        }
        res.status(200).json({ user, posts, comments });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getDeletedUserById = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        if (user.userType !== "admin") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 5;
            const [user, posts, comments] = await Promise.all([
                user_model_1.default.findById(req.params.id, { password: 0 })
                    .populate({
                    path: "deletedData.deletedBy",
                    select: "firstName lastName",
                })
                    .populate({
                    path: "following",
                    select: "firstName lastName avatarUrl",
                    options: { limit },
                }),
                post_model_1.default.find({ published: true, author: req.params.id }).populate({
                    path: "topic",
                }),
                comment_model_1.default.find({ author: req.params.id }).populate({
                    path: "post",
                    select: "title",
                    populate: {
                        path: "author",
                        select: "firstName lastName",
                    },
                }),
            ]);
            res.status(200).json({ user, posts, comments });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.createUser = [
    passport_1.default.authenticate("jwt", { session: false }),
    upload.single("avatar"),
    (0, express_validator_1.body)("firstName")
        .trim()
        .isLength({ min: 2 })
        .withMessage("First name must be at least 2 characters long"),
    (0, express_validator_1.body)("lastName")
        .trim()
        .isLength({ min: 2 })
        .withMessage("Last name must be at least 2 characters long"),
    (0, express_validator_1.body)("email").trim().isEmail().withMessage("Email must be valid"),
    (0, express_validator_1.body)("username")
        .trim()
        .isLength({ min: 2 })
        .withMessage("Username must be at least 2 characters long"),
    (0, express_validator_1.body)("password")
        .trim()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long"),
    (0, express_validator_1.body)("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords must match");
        }
        return true;
    }),
    (0, express_validator_1.body)("userType")
        .optional()
        .trim()
        .isIn(["admin", "user"])
        .withMessage("User type must be either admin or user"),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const reqUser = req.user;
        if (!reqUser) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        if (reqUser.userType !== "admin") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        try {
            const { firstName, lastName, email, username, userType } = req.body;
            let avatarUrl = "";
            const resizedAvatar = await (0, resizeImage_1.default)(req.file);
            if (resizedAvatar)
                avatarUrl = await (0, uploadToCloudinary_1.default)(resizedAvatar);
            const userExists = await user_model_1.default.findOne({ email });
            if (userExists) {
                res.status(400).json({ email: "Email already exists" });
                return;
            }
            const hashedPassword = await bcryptjs_1.default.hash(req.body.password, 10);
            const user = new user_model_1.default({
                firstName,
                lastName,
                password: hashedPassword,
                email,
                username,
                userType,
                avatarUrl,
            });
            const result = await user.save();
            if (!result) {
                res.status(500).json("Could not save user");
                return;
            }
            res.status(201).json(user);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.updateUserPassword = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_validator_1.body)("password")
        .trim()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long"),
    (0, express_validator_1.body)("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password)
            throw new Error("Passwords must match");
        return true;
    }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const reqUser = req.user;
        if (!reqUser) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        if (reqUser.userType !== "admin" &&
            reqUser._id.toString() !== req.params.id) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        try {
            const { password } = req.body;
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            const result = await user_model_1.default.findByIdAndUpdate(req.params.id, { password: hashedPassword }, { new: true });
            if (!result) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            res.status(201).json({ message: "Password updated successfully" });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.updateUser = [
    passport_1.default.authenticate("jwt", { session: false }),
    upload.single("avatar"),
    (0, express_validator_1.body)("firstName")
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage("First name must be at least 2 characters long"),
    (0, express_validator_1.body)("lastName")
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage("Last name must be at least 2 characters long"),
    (0, express_validator_1.body)("email").optional().trim().isEmail().withMessage("Email must be valid"),
    (0, express_validator_1.body)("username").optional().trim().isLength({ min: 2 }),
    (0, express_validator_1.body)("userType").optional().trim().isIn(["admin", "user"]),
    (0, express_validator_1.body)("description").optional().trim(),
    (0, express_async_handler_1.default)(async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const reqUser = req.user;
        if (!reqUser) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        const userId = req.params.id;
        if (String(reqUser._id) !== userId && reqUser.userType !== "admin") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        try {
            const user = await user_model_1.default.findById(userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            const resizedAvatar = await (0, resizeImage_1.default)(req.file);
            if (resizedAvatar)
                req.body.avatarUrl = await (0, uploadToCloudinary_1.default)(resizedAvatar);
            if (user.avatarUrl && req.body.avatarUrl) {
                const result = await cloudinary_1.v2.uploader.destroy(user.avatarUrl);
                if (result.result !== "ok") {
                    res
                        .status(500)
                        .json({ message: "Could not delete old avatar from cloudinary" });
                    return;
                }
            }
            user.set(req.body);
            const updatedUser = await user.save();
            if (!updatedUser) {
                res.status(400).json({ message: "Could not update user" });
                return;
            }
            res
                .status(201)
                .json({ updatedUser, message: "User updated successfully" });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.deleteUser = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        const userId = req.params.id;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        if (String(user._id) !== userId && user.userType !== "admin") {
            res.status(403).json({
                message: "Unauthorized: user is not an admin or is trying to delete someone who they are not permitted to delete.",
            });
            return;
        }
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const userToDelete = await user_model_1.default.findById(userId).session(session);
            if (!userToDelete) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            const deletedBy = String(user._id) === userId ? null : user._id;
            const deletedUser = await user_model_1.default.findByIdAndUpdate(userId, {
                isDeleted: true,
                "deletedData.deletedBy": deletedBy,
                "deletedData.deletedAt": new Date(),
                "deletedData.email": userToDelete.email,
                "deletedData.username": userToDelete.username,
                "deletedData.followerCount": userToDelete.followers.length ?? 0,
                email: `redacted-${(0, uuid_1.v4)()}`,
                username: `redacted-${(0, uuid_1.v4)()}`,
                password: "",
            }, {
                new: true,
                session: session,
            });
            if (!deletedUser) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            await user_model_1.default.updateMany({}, { $pull: { followers: userId, following: userId } }, { session: session });
            await session.commitTransaction();
            res.status(201).json({ userToDelete });
        }
        catch (error) {
            await session.abortTransaction();
            if (error.message === "User not found")
                res.status(404).json({ message: error.message });
            else
                res.status(500).json({ message: error.message });
        }
        finally {
            session.endSession();
        }
    }),
];
exports.getUserPosts = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.params.id);
        if (!user || user.isDeleted) {
            res.status(404).json({ message: "User not found or has been deleted" });
            return;
        }
        const postCount = await post_model_1.default.countDocuments({ author: req.params.id });
        const postsQuery = post_model_1.default.find({ author: req.params.id }).populate("topic");
        if (req.query.offset) {
            const offset = parseInt(req.query.offset);
            postsQuery.skip(offset);
        }
        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            postsQuery.limit(limit);
        }
        const posts = await postsQuery.exec();
        res.status(200).json({ posts, meta: { total: postCount } });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPopularAuthors = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const start = (0, calculateStartTime_1.calculateStartTime)(req.query.timeRange);
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const authorCount = await post_model_1.default.aggregate([
            {
                $match: {
                    published: true,
                },
            },
            {
                $group: {
                    _id: "$author",
                },
            },
            {
                $count: "authorCount",
            },
        ]).exec();
        let usersQuery = post_model_1.default.aggregate([
            {
                $match: {
                    published: true,
                },
            },
            {
                $unwind: {
                    path: "$likes",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    isInRange: {
                        $cond: {
                            if: { $gte: ["$likes.date", start] },
                            then: 1,
                            else: 0,
                        },
                    },
                },
            },
            {
                $group: {
                    _id: "$author",
                    likesCount: { $sum: "$isInRange" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $match: {
                    "user.isDeleted": false,
                },
            },
            {
                $sort: { likesCount: -1, _id: 1 },
            },
            {
                $limit: limit,
            },
            {
                $project: {
                    _id: "$user._id",
                    firstName: "$user.firstName",
                    lastName: "$user.lastName",
                    username: "$user.username",
                    description: "$user.description",
                    followers: "$user.followers",
                    createdAt: "$user.createdAt",
                    likesCount: 1,
                },
            },
        ]);
        if (req.query.offset) {
            const offset = parseInt(req.query.offset);
            usersQuery = usersQuery.skip(offset);
        }
        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            usersQuery = usersQuery.limit(limit);
        }
        const users = await usersQuery.exec();
        res.status(201).json({ users, meta: { total: authorCount } });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getUserFollowing = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.params.id)
            .populate("following", "username followers")
            .select("following");
        if (!user || user.isDeleted) {
            res.status(404).json({ message: "User not found or has been deleted" });
            return;
        }
        res.status(200).json({ following: user.following });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.addFollower = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        const userId = user._id;
        if (req.params.id === userId.toString()) {
            res.status(400).json({ message: "You can't follow yourself" });
            return;
        }
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const userFollowed = await user_model_1.default.findById(req.params.id);
            if (!userFollowed || userFollowed.isDeleted) {
                await session.abortTransaction();
                session.endSession();
                res.status(404).json({ message: "User not found" });
                return;
            }
            await user_model_1.default.findByIdAndUpdate(req.params.id, { $addToSet: { followers: userId } }, { new: true, session });
            const userFollowing = await user_model_1.default.findByIdAndUpdate(userId, { $addToSet: { following: req.params.id } }, { new: true, session });
            await session.commitTransaction();
            session.endSession();
            res.status(201).json({ userFollowed, userFollowing });
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.removeFollower = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        const userId = user._id;
        if (req.params.id === userId.toString()) {
            res.status(400).json({ message: "You can't unfollow yourself" });
            return;
        }
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const userUnfollowed = await user_model_1.default.findById(req.params.id);
            if (!userUnfollowed || userUnfollowed.isDeleted) {
                await session.abortTransaction();
                session.endSession();
                res.status(404).json({ message: "User not found" });
                return;
            }
            await user_model_1.default.findByIdAndUpdate(req.params.id, { $pull: { followers: userId } }, { new: true, session });
            const userUnfollowing = await user_model_1.default.findByIdAndUpdate(userId, { $pull: { following: req.params.id } }, { new: true, session });
            await session.commitTransaction();
            session.endSession();
            res.status(201).json({ userUnfollowed, userUnfollowing });
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({ message: error.message });
        }
    }),
];
exports.getSavedPosts = [
    passport_1.default.authenticate("jwt", { session: false }),
    (0, express_async_handler_1.default)(async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "No user logged in" });
            return;
        }
        try {
            const userSavedPosts = await user_model_1.default.findById(user._id)
                .populate({
                path: "savedPosts",
                populate: [
                    {
                        path: "author",
                        select: "firstName lastName isDeleted",
                    },
                    {
                        path: "topic",
                        select: "name",
                    },
                ],
            })
                .select("savedPosts");
            if (!userSavedPosts) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            const savedPostsCount = userSavedPosts.savedPosts.length;
            res.status(200).json({
                savedPosts: userSavedPosts?.savedPosts,
                savedPostsCount,
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }),
];
//# sourceMappingURL=user.controller.js.map