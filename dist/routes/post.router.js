"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const post_controller_1 = require("../controllers/post.controller");
const router = express_1.default.Router();
router.get("/", post_controller_1.getPosts);
router.post("/", post_controller_1.createPost);
router.get("/popular", post_controller_1.getPopularPosts);
router.get("/preview", post_controller_1.getPostsPreview);
router.get("/following", post_controller_1.getFollowingPosts);
router.put("/saved-posts/:id", post_controller_1.toggleSavedPost);
router.get("/:id", post_controller_1.getPostById);
router.put("/:id", post_controller_1.updatePost);
router.delete("/:id", post_controller_1.deletePost);
router.get("/:id/likes", post_controller_1.getLikes);
router.put("/:id/like", post_controller_1.likePost);
router.put("/:id/unlike", post_controller_1.unlikePost);
exports.default = router;
//# sourceMappingURL=post.router.js.map