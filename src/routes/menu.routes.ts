import { Router } from "express";
import { create, getAll, getById, remove, update, } from "../controllers/menu.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createMenuItemSchema, menuItemIdSchema, menuQuerySchema, updateMenuItemSchema, } from "../validations/menu.validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Public
router.get("/", validate(menuQuerySchema, "query"), asyncHandler(getAll));

router.get("/:id", validate(menuItemIdSchema, "params"), asyncHandler(getById));

// Restaurant admin
router.post("/", authenticate, requireRole("RESTAURANT_ADMIN"), 
validate(createMenuItemSchema, "body"), asyncHandler(create));

router.patch("/:id", authenticate, requireRole("RESTAURANT_ADMIN"), 
validate(updateMenuItemSchema, "body"), validate(menuItemIdSchema, "params"), asyncHandler(update));

router.delete("/:id", authenticate, requireRole("RESTAURANT_ADMIN"), 
validate(menuItemIdSchema, "params"), asyncHandler(remove));

export default router;