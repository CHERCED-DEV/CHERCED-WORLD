import DataBase from './database/db'
import { ProjectsConfig } from './database/interfaces';
import { NextApiRequest, NextApiResponse } from "next";


const allProjectsById = async (req: NextApiRequest, res: NextApiResponse) =>{
    const db = new DataBase()
    const id: string = req.query.id 
    const project: ProjectsConfig{} = await db.getById(id)
    res.json(project)
}

export default allProjectsById;