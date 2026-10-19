import multer from "multer";

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb,) => {

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Only JPG, PNG and WebP images are allowed"),);
    }

    cb(null, true);
};

export const uploadMenuImage = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});