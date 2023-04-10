import express, { Application, Request, Response } from "express";
import { comments } from "./database/comments.data";
import { CommentsConfig } from "./database/comments.interface";

const cors = require("cors");
const commentsApi: Application = express();

commentsApi.get("/api/blog/comments", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(comments);
});

commentsApi.post("/api/blog/comments", (req: Request, res: Response) => {
  const newComment: CommentsConfig = req.body;
  try {
    comments[newComment.postId].push(newComment);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ message: "Comment successfully posted" });
  } catch (error) {
    console.error(error);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ message: "Server error" });
  }
});

commentsApi.use(cors({ origin: process.env.VERCEL_URL_CORS }));

export default commentsApi;
