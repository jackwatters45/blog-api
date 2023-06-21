"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, trim: true, maxlength: 25 },
    lastName: { type: String, required: true, trim: true, maxlength: 25 },
    email: { type: String, required: true, trim: true, unique: true },
    username: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true, trim: true, minlength: 8 },
    userType: {
        type: String,
        required: true,
        trim: true,
        default: "user",
        enum: ["user", "admin"],
    },
    followers: [{ type: mongoose_1.Types.ObjectId, ref: "User", default: [] }],
    following: [{ type: mongoose_1.Types.ObjectId, ref: "User", default: [] }],
    isDeleted: { type: Boolean, default: false },
    description: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, trim: true, default: "" },
    savedPosts: [{ type: mongoose_1.Types.ObjectId, ref: "Post", default: [] }],
    deletedData: {
        deletedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
        deletedAt: { type: Date },
        email: { type: String, trim: true },
        username: { type: String, trim: true },
        followerCount: { type: Number },
    },
}, { timestamps: true });
UserSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});
UserSchema.index({
    firstName: "text",
    lastName: "text",
    email: "text",
    username: "text",
});
exports.default = (0, mongoose_1.model)("User", UserSchema);
//# sourceMappingURL=user.model.js.map