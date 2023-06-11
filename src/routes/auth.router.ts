import express from "express";
import {
	postLogout,
	postLogin,
	postSignUp,
	getCurrentUser,
} from "../controllers/auth.controller";

const router = express.Router();

//  /login
router.post("/login", postLogin);

// /signup
router.post("/signup", postSignUp);

// /logout
router.post("/logout", postLogout);

// /me
router.get("/me", getCurrentUser);

export default router;
