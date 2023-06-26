"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const configOtherMiddleware = (app) => {
    app.use((0, morgan_1.default)("dev"));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: false }));
    app.use((0, cookie_parser_1.default)(process.env.SESSION_SECRET));
    app.use((0, cors_1.default)({
        origin: [
            "http://blog-api-frontend-self.vercel.app",
            "https://blog-api-frontend-self.vercel.app",
            "http://localhost:5173",
            "https://localhost:5173",
        ],
        credentials: true,
    }));
};
exports.default = configOtherMiddleware;
//# sourceMappingURL=otherConfig.js.map