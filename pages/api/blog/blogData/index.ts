import type { NextApiRequest, NextApiResponse } from 'next'
import { BlogCms } from './blog.cms'

export default (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    switch (req.method) {
        case 'GET':
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(BlogCms);
            break;
        default:
            res.setHeader('Content-Type', 'application/json');
            res.status(405).json({ message: 'Method not allowed' });
            break;
    }
    return Promise.resolve();
};
