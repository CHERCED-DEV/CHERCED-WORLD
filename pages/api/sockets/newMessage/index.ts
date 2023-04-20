import express, { Application, Request, Response } from "express";
import { dbConnect } from "../../../../utils/mongoDB/mongoose";
import newMessage from "./database/newMessage.model";

dbConnect();
const cors = require("cors");

const socketNewMessage: Application = express();

type NewMessage = {
  _id: string;
  notification: number;
};

socketNewMessage.get(
  "/api/sockets/newMessage",
  async (req: Request, res: Response) => {
    try {
      const newMessageNotification: NewMessage | null = await newMessage
        .findOne()
        .sort({ _id: -1 })
        .limit(1);
      if (newMessageNotification !== null) {
        console.log(
          `You have ${newMessageNotification.notification} new messages`
        );
        res.setHeader("Content-Type", "application/json");
        res.status(200).json(newMessageNotification);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.status(404).json({ message: "No se encontró ningún mensaje" });
      }
    } catch (error) {
      console.error("Ha ocurrido un error en el servidor", error);
      res.setHeader("Content-Type", "application/json");
      res.status(500).json({ message: "Ha ocurrido un error en el servidor" });
    }
  }
);

socketNewMessage.put(
  "/api/sockets/newMessage",
  async (req: Request, res: Response) => {
    try {
      const { notification } = req.body;
      const result = await newMessage.updateOne(
        {},
        { $set: { notification: notification } }
      );
      res.status(200).json({ message: "updated!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

socketNewMessage.use(cors({ origin: process.env.VERCEL_URL_CORS }));

export default socketNewMessage;
