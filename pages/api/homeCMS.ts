// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { HomeDB } from './customCMS/HomeDB'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

export default (request: NextApiRequest, response: NextApiResponse) => {
  response.status(200).json(HomeDB);
};
