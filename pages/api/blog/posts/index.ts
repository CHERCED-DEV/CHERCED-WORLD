import express, { Application, Request, Response } from "express";
import { posts } from "./database/posts.data";

const cors = require("cors");
const postsApi: Application = express();

postsApi.get("/api/blog/posts", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(posts);
});



postsApi.use(cors({ origin: process.env.VERCEL_URL_CORS }));

export default postsApi;