import { NextApiRequest, NextApiResponse } from "next";
import { postContactMe } from "./database/postContactMe";
import { ContactMeFieldsInfoConfig } from "./database/interfaceMessage"

export default (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case 'GET':
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(postContactMe);
            break;
        case 'POST':
            const newMessage: ContactMeFieldsInfoConfig = req.body;
            postContactMe.push(newMessage);
            res.setHeader('Content-Type', 'application/json');
            res.status(201).json({ message: 'Mensaje enviado exitosamente' });
            break;
        default:
            res.setHeader('Content-Type', 'application/json');
            res.status(405).json({ message: 'Method not allowed' });
            break;
    }
};
