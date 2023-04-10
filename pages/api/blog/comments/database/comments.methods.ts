import { comments } from "./comments.data";
import { CommentsConfig } from "./comments.interface";

class DataBase {
  constructor() {}

  async create(key: string, comment: CommentsConfig): Promise<void> {
    comments[key].push(comment);
    await randomDelay();
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
