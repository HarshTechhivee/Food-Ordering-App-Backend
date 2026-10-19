import { DeleteObjectCommand, PutObjectCommand, } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { s3Client, getMenuImagesBucket } from "../config/s3.js";

const IMAGE_EXTENSIONS: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

export const uploadMenuImageToS3 = async (file: Express.Multer.File,): Promise<string> => {

    const extension = IMAGE_EXTENSIONS[file.mimetype];

    if (!extension || !file.buffer?.length) {
        throw new Error("Invalid or empty menu image");
    }

    const key = `menu/${randomUUID()}${extension}`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: getMenuImagesBucket(),
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }),
    );

    // Store this key in PostgreSQL, not the temporary URL.
    return key;
};

export const getMenuImageUrl = async (image: string | null): Promise<string | null> => {

    if (!image) {
        return null;
    }

    // Preserve existing local image URLs and absolute URLs.
    if (image.startsWith("/uploads/") || /^https?:\/\//i.test(image)) {
        return image;
    }

    // Convert S3 menu image keys into stable public URLs.
    if (image.startsWith("menu/")) {

        const bucket = getMenuImagesBucket();

        const region = process.env.AWS_REGION || "ap-southeast-2";

        const encodedKey = image.split("/").map((segment) => encodeURIComponent(segment)).join("/");    

        return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
    }

    return image;
};

export const deleteMenuImageFromS3 = async (image: string | null,): Promise<void> => {

    if (!image || !image.startsWith("menu/")) {
        return;
    }

    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: getMenuImagesBucket(),
            Key: image,
        }),
    );
};