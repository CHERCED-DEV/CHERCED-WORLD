import { IncomingMessage, ServerResponse } from "http";
import DataBase from "./database/db";

const allPost = async (req: IncomingMessage, res: ServerResponse) => {
	const db = new DataBase();
	const allEntries = await db.getAll();
	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify({ posts: allEntries }));
};

export default allPost;