import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { register, login, me, refresh, logout } from "../controllers/auth.controller.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", validate(registerSchema, "body"), asyncHandler(register));

router.post("/login", validate(loginSchema, "body"), asyncHandler(login));

router.post("/logout", asyncHandler(logout));

router.post("/refresh", asyncHandler(refresh));

router.get("/me", authenticate, asyncHandler(me));

export default router;