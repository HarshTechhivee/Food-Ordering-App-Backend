import { Router } from "express";
import { createReviewController, getMenuItemReviewsController, updateReviewController, deleteReviewController, }
    from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createReviewSchema, updateReviewSchema, reviewIdParamsSchema, orderIdParamsSchema, menuItemIdParamsSchema, reviewPaginationSchema, }
    from "../validations/review.validation.js";

const router = Router();

// Public: Get reviews for a menu item.
router.get(
    "/menu/:menuItemId",
    validate(menuItemIdParamsSchema, "params"),
    validate(reviewPaginationSchema, "query"),
    asyncHandler(getMenuItemReviewsController),
);

// Authenticated customer: Create a review for a delivered order.
router.post(
    "/orders/:orderId",
    authenticate,
    validate(orderIdParamsSchema, "params"),
    validate(createReviewSchema, "body"),
    asyncHandler(createReviewController),
);

// Authenticated customer: Update their review.
router.patch(
    "/:reviewId",
    authenticate,
    validate(reviewIdParamsSchema, "params"),
    validate(updateReviewSchema, "body"),
    asyncHandler(updateReviewController),
);

// Authenticated customer: Delete their review.
router.delete(
    "/:reviewId",
    authenticate,
    validate(reviewIdParamsSchema, "params"),
    asyncHandler(deleteReviewController),
);

export default router;