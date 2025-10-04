/**
 * Service encapsulating S3 signed URL generation using the AWS SDK v3.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicEndpoint: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('s3.bucket') ?? 'cleanops-media';
    this.publicEndpoint = config.get<string>('s3.publicEndpoint') ?? 'http://localhost:9000';
    this.client = new S3Client({
      region: config.get<string>('s3.region') ?? 'ap-southeast-2',
      endpoint: config.get<string>('s3.endpoint'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.get<string>('s3.accessKey') ?? 'cleanops',
        secretAccessKey: config.get<string>('s3.secretKey') ?? 'cleanopssecret'
      }
    });
  }

  async createUploadUrl(contentType: string) {
    const key = `${randomUUID()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
    return {
      uploadUrl,
      objectKey: key,
      publicUrl: `${this.publicEndpoint}/${this.bucket}/${key}`
    };
  }

  async createDownloadUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getObject(objectKey: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey
    });
    const response = await this.client.send(command);
    const stream = response.Body as any;
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async putObject(objectKey: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType
    });
    await this.client.send(command);
  }

  async objectExists(objectKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}
