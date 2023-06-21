"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_autopopulate_1 = __importDefault(require("mongoose-autopopulate"));
const commentSchema = new mongoose_1.Schema({
    content: { type: String, required: true, trim: true },
    author: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
        autopopulate: {
            select: "firstName lastName avatarUrl isDeleted",
        },
    },
    post: { type: mongoose_1.Types.ObjectId, ref: "Post", required: true },
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "User", default: [] }],
    dislikes: [{ type: mongoose_1.Types.ObjectId, ref: "User", default: [] }],
    isDeleted: { type: Boolean, default: false },
    parentComment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Comment",
    },
    replies: [
        { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment", autopopulate: true },
    ],
}, { timestamps: true });
commentSchema.plugin(mongoose_autopopulate_1.default);
exports.default = (0, mongoose_1.model)("Comment", commentSchema);
//# sourceMappingURL=comment.model.js.map