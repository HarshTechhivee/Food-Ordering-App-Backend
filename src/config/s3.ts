import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-southeast-2",
});

export const getMenuImagesBucket = (): string => {
    const bucket = process.env.AWS_S3_BUCKET_NAME;

    if (!bucket) {
        throw new Error("Missing AWS_S3_BUCKET_NAME environment variable",);
    }

    return bucket;
};