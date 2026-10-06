import type { Request, Response } from "express";
import { getDashboardStats } from "../services/adminDashboard.service.js";

export const getDashboard = async (req: Request, res: Response) => {

    const stats = await getDashboardStats();

    return res.status(200).json({
        success: true,
        data: stats,
    });
};