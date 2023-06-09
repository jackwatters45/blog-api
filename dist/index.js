"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const authConfig_1 = __importDefault(require("./middleware/authConfig"));
const otherConfig_1 = __importDefault(require("./middleware/otherConfig"));
const prodConfig_1 = __importDefault(require("./middleware/prodConfig"));
const database_1 = __importDefault(require("./config/database"));
const routes_1 = __importDefault(require("./routes"));
const errorConfig_1 = __importDefault(require("./middleware/errorConfig"));
const cloudinary_1 = __importDefault(require("./config/cloudinary"));
dotenv_1.default.config();
const app = (0, express_1.default)();
(0, authConfig_1.default)(app);
(0, otherConfig_1.default)(app);
(0, prodConfig_1.default)(app);
(0, database_1.default)();
(0, cloudinary_1.default)();
(0, routes_1.default)(app);
(0, errorConfig_1.default)(app);
const port = process.env.PORT ?? 5172;
app.listen(port, () => {
    console.log(`Server is running on port ${process.env.PORT ?? 5172}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map