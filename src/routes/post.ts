import express from "express";

const router = express.Router();

// /posts
router.get("/");

// /posts/:id
router.get("/:id");

// /posts/:id
router.post("/:id");

// /posts/:id
router.put("/:id");

// /posts/:id
router.delete("/:id");

// /posts/:id/like
router.post("/:id/like");

export default router;
