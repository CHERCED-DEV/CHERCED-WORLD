// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { CMS } from './CMS'
import type { NextApiRequest, NextApiResponse } from 'next'

export default (request: NextApiRequest, response: NextApiResponse) => {
  response.status(200).json(CMS);
};
