import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/pool.config';

export const apiKeyCheck = async(req: Request, res: Response, next: NextFunction) => {
     const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const rows = await pool.query("SELECT * FROM api_keys WHERE api_key=$1",[token])
        if(rows.rows.length>=1){
            next()
            return
        }
        else{
            res.status(400).json({error:"API key expired or invalid."})
        }
    }
    else{
        res.status(400).json({error:"API key is not provided or invalid."})
    }
};