import { posts } from "./posts.data";
import { CommentsConfig } from "./post.interface";

class DataBase {
  constructor() {}

  async create(comment: CommentsConfig, postId: string): Promise<void> {
    const postIndex = posts.findIndex((post) => post.id === postId);
    if (postIndex !== -1) {
      posts[postIndex].comments?.push(comment);
      await randomDelay();
    } else {
      throw new Error(`Post with id ${postId} not found.`);
    }
  }
}

// Let's also add a delay to make it a bit closer to reality
const randomDelay = () =>
  new Promise((resolve) => {
    const max = 350;
    const min = 100;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;

    setTimeout(resolve, delay);
  });

export default DataBase;