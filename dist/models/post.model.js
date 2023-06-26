"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const postSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, trim: true, maxlength: 10000 },
    author: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    published: { type: Boolean, required: true, default: false },
    topic: { type: mongoose_1.Types.ObjectId, ref: "Topic" },
    likes: [
        {
            userId: { type: mongoose_1.Types.ObjectId, ref: "User" },
            date: { type: Date, default: Date.now },
        },
    ],
    comments: [{ type: mongoose_1.Types.ObjectId, ref: "Comment", autopopulate: true }],
}, { timestamps: true });
postSchema.path("likes").default([]);
postSchema.path("comments").default([]);
const toHyphenCase = (str) => {
    return str
        .split(" ")
        .map((word) => word.toLowerCase())
        .join("-");
};
postSchema.virtual("url").get(function () {
    return `https://.blogName.com/posts/${toHyphenCase(this.title)}`;
});
postSchema.index({
    title: "text",
    content: "text",
    author: "text",
    topic: "text",
});
exports.default = (0, mongoose_1.model)("Post", postSchema);
//# sourceMappingURL=post.model.js.map