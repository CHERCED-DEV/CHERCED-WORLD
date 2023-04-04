import express, { Application, Request, Response } from 'express';
import { postContactMe } from "./database/postContactMe";
import { ContactMeFieldsInfoConfig } from "./database/interfaceMessage";

const cors = require('cors');

const contactMeApi: Application = express();

contactMeApi.get('/api/contactMe', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(postContactMe);
});

contactMeApi.post('/api/contactMe', (req: Request, res: Response) => {
  const newMessage: ContactMeFieldsInfoConfig = req.body;
  postContactMe.push(newMessage);
  res.setHeader('Content-Type', 'application/json');
  res.status(201).json({ message: 'Mensaje enviado exitosamente' });
});

contactMeApi.use(cors(
    {origin: process.env.VERCEL_URL_CORS}
));

export default contactMeApi;
