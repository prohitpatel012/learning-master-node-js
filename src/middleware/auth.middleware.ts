import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";


export const verifyToken = async(req : Request, res : Response, next : NextFunction) => {

    try {
        const token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "");
        logger.info("Token from request:", token);

        if (!token) {
            logger.error("Access denied. No token provided.");
            return res.status(401).json({ message: "Access denied. No token provided." });
            
        }



        

       const decodedToken =  jwt.verify(token, process.env.JWT_ACCESS_SECRET as string)
       

        const users = await query("select id, name , email, role, whatsapp_number, is_active from users where id = $1", [decodedToken.sub])
       
        // console.log(users.rows[0]);

           if (users.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid access token. User not found."
            });
        }

        if (!users.rows[0].is_active) {
            return res.status(403).json({
                message: "Your account is inactive."
            });
        }


        req.user = users.rows[0];


        logger.info({ userId: users.rows[0].id }, "User authenticated successfully");

        next();
        
    } catch (error) {
        logger.error("Error occurred while verifying token.");
        return res.status(500).json({ message: "Internal server error." });
    }
        
    

}



export const verifyRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Access denied. No user information found." });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied. You do not have permission to perform this action." });
        }
        next();
    }

}