import express, { Application, Request, Response } from "express";
import { dbConnect } from "../../../../utils/mongoDB/mongoose";
import Comment from "./database/comments.model";

dbConnect();
const cors = require("cors");
const commentsApi: Application = express();

commentsApi.get(
  "/api/blog/comments/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const comments = await Comment.find({ postId: id }).exec();
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(comments);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal server error");
    }
  }
);

commentsApi.post(
  "/api/blog/comments/:id",
  async (req: Request, res: Response) => {
    const { body } = req;
    try {
      const newComment = new Comment(body);
      const savedComment = await newComment.save();
      res.setHeader("Content-Type", "application/json");
      res.status(200).json({ message: "Comment successfully posted" });
    } catch (error) {
      console.error(error);
      res.setHeader("Content-Type", "application/json");
      res.status(500).json({ message: "Server error" });
    }
  }
);

commentsApi.use(cors({ origin: process.env.VERCEL_URL_CORS }));

export default commentsApi;
