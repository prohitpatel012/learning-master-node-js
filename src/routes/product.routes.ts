
import express from "express";
import { createProduct, viewProducts } from "../controllers/product.controller.js";
import { verifyToken, verifyRoles } from "../middleware/auth.middleware.js";

const router = express.Router();


router.post("/create", verifyToken, verifyRoles("SUPERADMIN"), createProduct)
router.get("/view-all-products", viewProducts)


export default router;