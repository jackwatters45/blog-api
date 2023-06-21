"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = __importDefault(require("passport-local"));
const passport_jwt_1 = __importDefault(require("passport-jwt"));
const user_model_1 = __importDefault(require("../models/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const LocalStrategy = passport_local_1.default.Strategy;
const JwtStrategy = passport_jwt_1.default.Strategy;
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies["jwt"];
    }
    return token;
};
const configPassport = (app) => {
    passport_1.default.use(new LocalStrategy(async (username, password, done) => {
        try {
            const user = await user_model_1.default.findOne({ email: username }).exec();
            if (!user)
                return done(null, false, { message: "Incorrect email" });
            const match = await bcryptjs_1.default.compare(password, user.password);
            if (match)
                return done(null, user);
            return done(null, false, { message: "Incorrect password" });
        }
        catch (err) {
            return done(err);
        }
    }));
    passport_1.default.use(new JwtStrategy({
        jwtFromRequest: cookieExtractor,
        secretOrKey: process.env.JWT_SECRET,
    }, async (jwtPayload, done) => {
        try {
            const user = await user_model_1.default.findById(jwtPayload.id);
            if (user)
                return done(null, user);
            return done(null, false, { message: "User not found" });
        }
        catch (err) {
            return done(err);
        }
    }));
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport_1.default.deserializeUser(async function (id, done) {
        try {
            const user = await user_model_1.default.findById(id);
            done(null, user);
        }
        catch (err) {
            done(err);
        }
    });
    app.use(function (req, res, next) {
        res.locals.currentUser = req.user;
        next();
    });
    app.use((0, express_session_1.default)({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60, secure: true, sameSite: "none" },
    }));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
};
exports.default = configPassport;
//# sourceMappingURL=authConfig.js.map