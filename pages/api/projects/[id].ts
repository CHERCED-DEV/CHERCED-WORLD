import DataBase from './database/db'
import { ProjectsConfig } from './database/interfaces';
import { NextApiRequest, NextApiResponse } from "next";


const allProjectsById = async (req: NextApiRequest, res: NextApiResponse) =>{
    if (!req.query.id) {
        res.status(400).json({ error: 'id parameter is required' });
        return;
    }
    const db = new DataBase()
    const id = req.query.id;
    try {
        const project: any = await db.getById(id)
        res.json(project)
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}


export default allProjectsById;