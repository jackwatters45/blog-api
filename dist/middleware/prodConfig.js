"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const configProdMiddleware = (app) => {
    app.use((0, compression_1.default)());
    app.use(helmet_1.default.contentSecurityPolicy({
        directives: {
            "script-src": ["self", "code.jquery.com", "cdn.jsdelivr.net"],
            "img-src": ["'self'", "https: data: blob:"],
        },
    }));
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000,
        max: 30,
        message: "Too many requests, please try again later.",
    });
    app.use(limiter);
};
exports.default = configProdMiddleware;
//# sourceMappingURL=prodConfig.js.map