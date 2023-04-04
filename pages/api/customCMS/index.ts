// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import express, { Application, Request, Response } from 'express';
import { CMS } from './CMS'

const cors = require('cors');
const customCmsApi: Application = express();

customCmsApi.get('/api/customCMS', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(CMS);
})

customCmsApi.use(cors(
    {origin: process.env.VERCEL_URL_CORS}
));


export default customCmsApi;