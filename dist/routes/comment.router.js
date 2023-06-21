"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comment_controller_1 = require("../controllers/comment.controller");
const router = express_1.default.Router({ mergeParams: true });
router.get("/", comment_controller_1.getComments);
router.get("/:id", comment_controller_1.getCommentById);
router.post("/", comment_controller_1.createComment);
router.put("/:id", comment_controller_1.updateComment);
router.delete("/:id", comment_controller_1.deleteComment);
router.post("/:id/like", comment_controller_1.likeComment);
router.post("/:id/dislike", comment_controller_1.dislikeComment);
router.post("/:id/reply", comment_controller_1.createCommentReply);
router.get("/:id/replies", comment_controller_1.getReplies);
exports.default = router;
//# sourceMappingURL=comment.router.js.map