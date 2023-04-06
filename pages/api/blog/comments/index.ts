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
    const validPost = newComment.postId === "" ? true : false;
    if (validPost) {
      const commentIndex = parseInt(newComment.postId);
      comments[commentIndex].push(newComment);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.status(400).json({ message: "Bad Request error" });
    }
  } catch (error) {
    console.error(error);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ message: "Server error" });
  }
});

commentsApi.use(cors({ origin: process.env.VERCEL_URL_CORS }));

export default commentsApi;
