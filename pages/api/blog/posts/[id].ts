import express, { Application, Request, Response } from "express";

const cors = require("cors");
const postApi: Application = express();

postApi.get("/api/blog/posts/:id", async (req: Request, res: Response) => {
    const postId = String(req.params.id);
    
    try {
      const response = await fetch(`${process.env.VERCEL_URL_CORS }/api/blog/posts`);
      const posts = await response.json();
  
      const post = posts.find((p: any) => p.id === postId);
  
      if (post) {
        res.setHeader("Content-Type", "application/json");
        res.status(200).json(post);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.status(404).json({ message: "Post not found" });
      }
    } catch (error) {
      console.error(error);
      res.setHeader("Content-Type", "application/json");
      res.status(500).json({ message: "Server error" });
    }
});

postApi.use(cors({ origin: process.env.VERCEL_URL_CORS }));

export default postApi;