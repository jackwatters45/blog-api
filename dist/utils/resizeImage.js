"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const resizeAvatar = async (file) => {
    if (!file || !file.buffer)
        return false;
    return await (0, sharp_1.default)(file.buffer).resize(128, 128).png().toBuffer();
};
exports.default = resizeAvatar;
//# sourceMappingURL=resizeImage.js.map