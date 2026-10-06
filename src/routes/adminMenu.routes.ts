import { Router } from "express";
import { uploadMenuImage } from "../utils/upload.js";
import { validate } from "../middleware/validate.middleware.js";
import { getAdminMenu, createAdminMenuItem, updateAdminMenuItem, getAdminMenuItem, updateAdminMenuItemAvailability, deleteAdminMenuItem } from "../controllers/adminMenu.controller.js";
import { createMenuItemSchema, updateMenuItemSchema, menuItemIdSchema, updateAvailabilitySchema } from "../validations/menu.validation.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, requireRole("RESTAURANT_ADMIN"), asyncHandler(getAdminMenu));

router.post(
    "/",
    authenticate,
    requireRole("RESTAURANT_ADMIN"),
    uploadMenuImage.single("image"),
    validate(createMenuItemSchema, "body"),
    asyncHandler(createAdminMenuItem)
);

router.get(
    "/:id",
    authenticate,
    requireRole("RESTAURANT_ADMIN"),
    validate(menuItemIdSchema, "params"),
    asyncHandler(getAdminMenuItem)
);

router.patch(
    "/:id",
    authenticate,
    requireRole("RESTAURANT_ADMIN"),
    uploadMenuImage.single("image"),
    validate(menuItemIdSchema, "params"),
    validate(updateMenuItemSchema, "body"),
    asyncHandler(updateAdminMenuItem)
);

router.patch(
    "/:id/availability",
    authenticate,
    requireRole("RESTAURANT_ADMIN"),
    validate(menuItemIdSchema, "params"),
    validate(updateAvailabilitySchema, "body"),
    asyncHandler(updateAdminMenuItemAvailability)
);

router.delete(
  "/:id",
  authenticate,
  requireRole("RESTAURANT_ADMIN"),
  validate(menuItemIdSchema, "params"),
  asyncHandler(deleteAdminMenuItem)
);

export default router;