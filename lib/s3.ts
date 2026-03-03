import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

/**
 * Generate a presigned URL for uploading a file directly to S3
 * For single-part uploads (≤5GB, recommended for ≤100MB)
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = true
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  // Generate cloud storage path
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${timestamp}-${sanitizedFileName}`
    : `${folderPrefix}uploads/${timestamp}-${sanitizedFileName}`;

  // Create presigned URL for upload
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry

  return { uploadUrl, cloud_storage_path };
}

/**
 * Upload a file directly to S3 (server-side upload)
 */
export async function uploadFileToS3(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string,
  isPublic: boolean = true
): Promise<string> {
  // Generate cloud storage path
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${timestamp}-${sanitizedFileName}`
    : `${folderPrefix}uploads/${timestamp}-${sanitizedFileName}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return cloud_storage_path;
}

/**
 * Get a file URL (public or signed)
 */
export async function getFileUrl(
  cloud_storage_path: string,
  isPublic: boolean = true
): Promise<string> {
  if (isPublic) {
    // For public files, return direct S3 URL
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  } else {
    // For private files, generate signed URL
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: cloud_storage_path,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(cloud_storage_path: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });
  await s3Client.send(command);
}
