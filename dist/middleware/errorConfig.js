"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const configErrorMiddleware = (app) => {
    app.use((req, _res, next) => {
        next((0, http_errors_1.default)(404));
    });
    const errorHandler = (err, req, res) => {
        res.locals.message = err.message ?? "Internal Server Error";
        res.locals.error = req.app.get("env") === "development" ? err : {};
        res.status(err.status || 500);
        res.send(err.message);
    };
    app.use(errorHandler);
};
exports.default = configErrorMiddleware;
//# sourceMappingURL=errorConfig.js.map