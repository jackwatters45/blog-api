"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const comment_router_1 = __importDefault(require("./comment.router"));
const post_router_1 = __importDefault(require("./post.router"));
const user_router_1 = __importDefault(require("./user.router"));
const auth_router_1 = __importDefault(require("./auth.router"));
const topic_router_1 = __importDefault(require("./topic.router"));
const search_router_1 = __importDefault(require("./search.router"));
const API_VERSION = "/api/v1";
const configRoutes = (app) => {
    app.use(`${API_VERSION}/auth`, auth_router_1.default);
    app.use(`${API_VERSION}/users`, user_router_1.default);
    app.use(`${API_VERSION}/posts`, post_router_1.default);
    app.use(`${API_VERSION}/posts/:post/comments`, comment_router_1.default);
    app.use(`${API_VERSION}/topics`, topic_router_1.default);
    app.use(`${API_VERSION}/search`, search_router_1.default);
};
exports.default = configRoutes;
//# sourceMappingURL=index.js.map