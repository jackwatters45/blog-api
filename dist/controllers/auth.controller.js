"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.postLogout = exports.postLogin = exports.postSignUp = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model"));
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uploadToCloudinary_1 = __importDefault(require("../utils/uploadToCloudinary"));
const resizeImage_1 = __importDefault(require("../utils/resizeImage"));
const handleUserLogin = (res, user) => {
    const payload = { id: user._id };
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret)
        throw new Error("JWT Secret not defined");
    const token = jsonwebtoken_1.default.sign(payload, jwtSecret, {
        expiresIn: "1h",
    });
    res.cookie("jwt", token, {
        maxAge: 3600000,
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });
    res.status(200).json({
        message: "Logged in successfully.",
        user,
        token,
    });
};
exports.postSignUp = [
    (0, express_validator_1.body)("firstName").notEmpty().trim(),
    (0, express_validator_1.body)("lastName").notEmpty().trim(),
    (0, express_validator_1.body)("email").notEmpty().trim().isEmail().normalizeEmail(),
    (0, express_validator_1.body)("username").notEmpty().trim().isLength({ min: 5 }),
    (0, express_validator_1.body)("password").notEmpty().trim().isLength({ min: 8 }),
    (0, express_validator_1.body)("confirmPassword")
        .notEmpty()
        .trim()
        .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords do not match");
        }
        return true;
    }),
    (0, express_async_handler_1.default)(async (req, res, next) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const { firstName, lastName, email, username } = req.body;
            let avatarUrl = "";
            const resizedAvatar = await (0, resizeImage_1.default)(req.file);
            if (resizedAvatar)
                avatarUrl = await (0, uploadToCloudinary_1.default)(resizedAvatar);
            const userExists = await user_model_1.default.findOne({ email });
            if (userExists) {
                res.status(400).json({ email: "Email already exists" });
                return;
            }
            const hashedPassword = await bcryptjs_1.default.hash(req.body.password, 10);
            const user = new user_model_1.default({
                firstName,
                lastName,
                password: hashedPassword,
                email,
                username,
                avatarUrl,
            });
            const result = await user.save();
            if (!result)
                throw new Error("Could not save user");
            handleUserLogin(res, user);
        }
        catch (err) {
            return next(err);
        }
    }),
];
exports.postLogin = [
    (0, express_validator_1.body)("username").notEmpty().trim(),
    (0, express_validator_1.body)("password").notEmpty().trim(),
    (0, express_async_handler_1.default)(async (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        passport_1.default.authenticate("local", { session: false }, function (err, user) {
            if (err)
                return next(err);
            if (!user) {
                res.status(404).json({ emailNotFound: "Email not found" });
                return;
            }
            req.logIn(user, (err) => {
                if (err)
                    return next(err);
                handleUserLogin(res, user);
            });
        })(req, res, next);
    }),
];
const postLogout = (req, res, next) => {
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });
    res.clearCookie("connect.sid", {
        secure: true,
        sameSite: "none",
    });
    req.logout((err) => {
        if (err)
            return next(err);
        res.status(200).json({ message: "User logged out successfully" });
    });
};
exports.postLogout = postLogout;
exports.getCurrentUser = (0, express_async_handler_1.default)(async (req, res) => {
    const token = req.cookies.jwt;
    if (!token) {
        res
            .status(200)
            .json({ isAuthenticated: false, message: "No user logged in" });
        return;
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret)
        throw new Error("JWT Secret not defined");
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const userId = decoded.id;
        const user = await user_model_1.default.findById(userId, { password: 0 });
        if (!user) {
            res
                .status(404)
                .json({ isAuthenticated: false, message: "User not found" });
            return;
        }
        res.status(200).json({ user, isAuthenticated: true });
    }
    catch (err) {
        res
            .status(401)
            .json({ isAuthenticated: false, message: "Invalid token" });
    }
});
//# sourceMappingURL=auth.controller.js.map