import express, { Application, Request, Response } from 'express';
import { BlogCms } from './database/blog.cms'

const cors = require('cors');
const blogCmsApi: Application = express();

blogCmsApi.get('/api/blog/blogData', (req: Request, res: Response) => { 
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(BlogCms);
})

blogCmsApi.use(cors(
    {origin: process.env.VERCEL_URL_CORS}
));

export default blogCmsApi;