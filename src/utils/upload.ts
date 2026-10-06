import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDirectory = path.join(process.cwd(), "uploads", "menu");

fs.mkdirSync(uploadDirectory, {
    recursive: true,
});

const storage = multer.diskStorage({

    destination: (_req, _file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (_req, file, cb) => {

        const extension = path.extname(file.originalname);

        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}${extension}`;

        cb(null, uniqueName);
    },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {

    const allowedTypes = ["image/jpeg", "image/png", "image/webp",];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Only JPG, PNG and WebP images are allowed"));
    }

    cb(null, true);
};

export const uploadMenuImage = multer({
    storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, },
});