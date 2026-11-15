import { Request, Response } from "express";
import { logger } from "../config/logger.js";
import { query } from "../config/db.js";

export const createProduct = async (req: Request, res: Response) => {


    try {

        // receive the request, name ,slug, description, price , stock, images , isactive, 

        const { name, slug, description, price, stock, images, is_active, category_id } = req.body;

        // category id from category table

        const createdBy = req.user?.id; // Assuming the user ID is available in req.user.id after authentication
        const whatsappNumber = req.user?.whatsapp_number; // Assuming the user's WhatsApp number is available in req.user.whatsapp_number after authentication



        const productCreationQuery = `
INSERT INTO products (name, slug, description, price, stock, category_id, images, created_by, whatsapp_number)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, name, slug, price, stock, category_id, images, created_by, whatsapp_number, created_at;
`;

        const result = await query(productCreationQuery, [name, slug, description, price, stock, category_id, images, createdBy, whatsappNumber]);

        const newProduct = result.rows[0];

        logger.info(`Product created successfully: ${newProduct.name} (ID: ${newProduct.id})`);


        return res.status(201).json({
            data: {
                id: newProduct.id,
                name: newProduct.name,
                slug: newProduct.slug,
                description: newProduct.description,
                price: newProduct.price,
                stock: newProduct.stock,
                category_id: newProduct.category_id,
                images: newProduct.images,
                created_by: newProduct.created_by,
                whatsapp_number: newProduct.whatsapp_number,
                created_at: newProduct.created_at
            }
        });




    } catch (error) {
        logger.error("Error occurred while creating product.");
        return res.status(500).json({ message: "Internal server error." });
    }



}






export const viewProducts = async (req: Request, res: Response) => {

    try {

        const productsQuery = `
        SELECT p.id, p.name, p.slug, p.description, p.price, p.stock, p.category_id, p.images, p.created_by, p.whatsapp_number, p.created_at from products p
        `;


        const products = await query(productsQuery);

        console.log(products.rows);

        return res.status(200).json({
            data: products.rows
        })




    } catch (error) {
        logger.error("Error occurred while fetching products.");
        return res.status(500).json({ message: "Internal server error.", error });

    }

}


