import type { RequestHandler } from "express";
import { createReview, getMenuItemReviews, updateReview, deleteReview, } from "../services/review.service.js";
import type {
    CreateReviewBody, MenuItemParams, OrderParams, PaginationQuery, ReviewParams, UpdateReviewBody,
} from "../types/review.types.js";

export const createReviewController: RequestHandler = async (req, res) => {

    const { orderId } = req.validatedParams as OrderParams;
    const body = req.validatedBody as CreateReviewBody;
    const userId = req.user!.userId;

    const review = await createReview(userId, orderId, body);

    res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review,
    });
};

export const getMenuItemReviewsController: RequestHandler = async (req, res) => {

    const { menuItemId } = req.validatedParams as MenuItemParams;
    const pagination = req.validatedQuery as PaginationQuery;

    const result = await getMenuItemReviews(menuItemId, pagination);

    res.status(200).json({
        success: true,
        message: "Reviews fetched successfully",
        data: result,
    });
};

export const updateReviewController: RequestHandler = async (req, res) => {

    const { reviewId } = req.validatedParams as ReviewParams;
    const body = req.validatedBody as UpdateReviewBody;
    const userId = req.user!.userId;

    const review = await updateReview(userId, reviewId, body);

    res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: review,
    });
};

export const deleteReviewController: RequestHandler = async (req, res) => {

    const { reviewId } = req.validatedParams as ReviewParams;
    const userId = req.user!.userId;

    await deleteReview(userId, reviewId);

    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
    });
};