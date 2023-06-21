"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.default.Router();
router.get("/popular", user_controller_1.getPopularAuthors);
router.get("/preview", user_controller_1.getUsersPreviewData);
router.get("/:id/saved-posts", user_controller_1.getSavedPosts);
router.put("/:id/follow", user_controller_1.addFollower);
router.put("/:id/unfollow", user_controller_1.removeFollower);
router.get("/:id/posts", user_controller_1.getUserPosts);
router.get("/:id/deleted", user_controller_1.getDeletedUserById);
router.get("/:id/following", user_controller_1.getUserFollowing);
router.put("/:id/password", user_controller_1.updateUserPassword);
router.get("/", user_controller_1.getUsers);
router.get("/:id", user_controller_1.getUserById);
router.post("/", user_controller_1.createUser);
router.patch("/:id/delete", user_controller_1.deleteUser);
router.patch("/:id", user_controller_1.updateUser);
exports.default = router;
//# sourceMappingURL=user.router.js.map