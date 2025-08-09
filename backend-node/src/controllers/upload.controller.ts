import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';


const s3Client = new S3Client({
    region: "us-east-1",
});

export async function getPresignedUrl(req: Request, res: Response) {
    const { contentType } = req.body
    const bucketName = process.env.S3_BUCKET_NAME;

    if (!contentType || !contentType.startsWith("video/")) {
        return res.status(400).json({ error: "Missing or Invalid Content Type" })
    }

    const fileExtension = contentType.split("/")[1]
    const fileKey = `uploads/${uuidv4()}.${fileExtension}`;

    try {
        {
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
                ContentType: `video/${fileExtension}`,
                ContentDisposition: 'attachment; filename="video.mp4"', // 👈 set here
            });
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return res.status(200).json({ url, key: fileKey })
        }
    }
    catch (error) {
        return res.status(500).json({ error: "Error while generating presigned url" })
    }
}





