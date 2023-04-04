import express, { Application, Request, Response } from 'express';
import { posts } from "./database/posts.data";
import { CommentsConfig } from "./database/post.interface";

const cors = require('cors');
const postsApi: Application = express(); 

postsApi.get('/api/blog/posts', (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(posts);
})

postsApi.post('/api/blog/posts', (req: Request, res: Response)=>{
    const newComment: CommentsConfig = req.body;
    const validPost = newComment.postId === "" ? true : false
    if (validPost) {
      res.setHeader("Content-Type", "application/json");
      res.status(404).json({ message: "Post not found" });
    } else {
      const post = posts.find((p) => p.id === newComment.postId);
      post?.comments?.push(newComment);
      res.setHeader("Content-Type", "application/json");
      res.status(201).json({ message: "Comentario agregado exitosamente" });
    }
})

postsApi.use(cors(
    {origin: process.env.VERCEL_URL_CORS}
));

export default postsApi;