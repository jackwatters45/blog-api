"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const search_controller_1 = require("../controllers/search.controller");
const router = express_1.default.Router();
router.get("/all", search_controller_1.searchAll);
router.get("/posts", search_controller_1.searchPosts);
router.get("/users", search_controller_1.searchUsers);
router.get("/admin/users", search_controller_1.searchUsersAdmin);
router.get("/my-posts", search_controller_1.searchMyPosts);
router.get("/topics", search_controller_1.searchTopics);
exports.default = router;
//# sourceMappingURL=search.router.js.map