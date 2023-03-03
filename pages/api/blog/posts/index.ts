import type { NextApiRequest, NextApiResponse } from "next";
import { posts } from "./database/posts.data";
import { CommentsConfig } from "./database/post.interface";

export default (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  switch (req.method) {
    case "GET":
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(posts);
      break;
    case "POST":
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
      break;
    default:
      res.setHeader("Content-Type", "application/json");
      res.status(405).json({ message: "Method not allowed" });
      break;
  }
  return Promise.resolve();
};