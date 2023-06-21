"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const topic_controller_1 = require("../controllers/topic.controller");
const router = express_1.default.Router();
router.get("/", topic_controller_1.getTopics);
router.get("/popular", topic_controller_1.getPopularTopics);
router.get("/:id/posts", topic_controller_1.getPostsByTopic);
router.get("/:id", topic_controller_1.getTopicById);
router.post("/", topic_controller_1.createTopic);
router.patch("/:id", topic_controller_1.updateTopic);
router.delete("/:id", topic_controller_1.deleteTopic);
exports.default = router;
//# sourceMappingURL=topic.router.js.map