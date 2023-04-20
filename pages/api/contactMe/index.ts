import express, { Application, Request, Response } from "express";
import { dbConnect } from "../../../utils/mongoDB/mongoose";
import Message from "./database/contactMe.model";

dbConnect();
const cors = require("cors");

const contactMeApi: Application = express();

const newNotification = async (): Promise<number> => {
  const data = await fetch(
    `${process.env.VERCEL_URL_CORS}/api/sockets/newMessage`
  );
  const result = await data.json();
  console.log(result.notification);
  console.log(result.notification + 1);
  return result.notification + 1;
};

contactMeApi.get("/api/contactMe", async (req: Request, res: Response) => {
  const messages = await Message.find();
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(messages);
});

contactMeApi.post("/api/contactMe", async (req: Request, res: Response) => {
  const newMessage = new Message(req.body);
  const savingMessage = await newMessage.save();
  const data = await fetch(
    `${process.env.VERCEL_URL_CORS}/api/sockets/newMessage`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notification: await newNotification(),
      }),
    }
  );
  res.setHeader("Content-Type", "application/json");
  res.status(201).json({ message: "Mensaje enviado exitosamente" });
});

contactMeApi.use(cors({ origin: process.env.VERCEL_URL_CORS }));

export default contactMeApi;
