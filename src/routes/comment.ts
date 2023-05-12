import express from "express";
import { getComments } from "../controllers/comment.controller";

const router = express.Router();

router.get("/", getComments);

router.post("/");

export default router;
