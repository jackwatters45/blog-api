"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const topicSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
}, { timestamps: true });
topicSchema.index({ name: "text" });
exports.default = (0, mongoose_1.model)("Topic", topicSchema);
//# sourceMappingURL=topic.model.js.map