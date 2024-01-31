import Cors from 'cors';
import type { NextApiRequest, NextApiResponse } from 'next';

const corsMiddleware = Cors({
  methods: ['GET', 'HEAD', 'POST'],
});

/**
 * Runs the given middleware function with the provided request and response, and 
 * returns a promise that resolves with the result or rejects with an error.
 *
 * @param {NextApiRequest} req - The request object
 * @param {NextApiResponse} res - The response object
 * @param {any} middlewareFunction - The middleware function to be executed
 * @return {Promise<any>} A promise that resolves with the result or rejects with an error
 */
export function runMiddleware(req: NextApiRequest, res: NextApiResponse, middlewareFunction: any) {
  return new Promise((resolve, reject) => {
    middlewareFunction(req, res, (result: any) => {
      result instanceof Error ? reject(result) : resolve(result);
    });
  });
}

export default corsMiddleware;
