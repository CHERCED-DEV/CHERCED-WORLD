import type { NextApiRequest, NextApiResponse } from "next";
import { posts } from "./posts";
import { ComentsConfig } from "./post.interface";

function isValidPost(postId: string): boolean {
  const post = posts.find((p) => p.id === postId);
  return !!post;
}

export default (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  switch (req.method) {
    case "GET":
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(posts);
      break;
    case "POST":
      const newComment: ComentsConfig = req.body;
      if (!isValidPost(newComment.postId)) {
        res.setHeader("Content-Type", "application/json");
        res.status(404).json({ message: "Post not found" });
      } else {
        const post = posts.find((p) => p.id === newComment.postId);
        post?.comnents.push(newComment);
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
