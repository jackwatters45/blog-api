"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
router.post("/login", auth_controller_1.postLogin);
router.post("/signup", auth_controller_1.postSignUp);
router.post("/logout", auth_controller_1.postLogout);
router.get("/me", auth_controller_1.getCurrentUser);
exports.default = router;
//# sourceMappingURL=auth.router.js.map