import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { AppError } from "./utils/AppError.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import authRoutes from "./routes/auth.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminOrderRoutes from "./routes/adminOrder.routes.js";
import adminMenuRoutes from "./routes/adminMenu.routes.js";
import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
import path from "node:path";
import paymentRoutes from "./routes/payment.routes.js";
import { stripeWebhook } from "./controllers/payment.controller.js";
import notificationRoutes from "./routes/notification.routes.js";
import { allowedOrigins } from "./config/allowedOrigins.js";
import reviewRoutes from "./routes/review.routes.js";

const app = express();

// const allowedOrigins = [
//     "http://localhost:5174",
//     "https://s1zdx1dk-5174.inc1.devtunnels.ms",
// ];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.post(
    "/api/payments/webhook",
    express.raw({
        type: "application/json",
    }),
    stripeWebhook
);


app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/menu", adminMenuRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/payments", paymentRoutes)
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Food Ordering API is running",
    });
});

app.get("/api/test-error",
    asyncHandler(async () => {
        throw new AppError("This is a test error", 400);
    })
);

// Error middleware must come AFTER routes
app.use(errorMiddleware);

export default app;