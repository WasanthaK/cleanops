/**
 * Application configuration factory, grouped by domain for easy injection.
 */
export default () => ({
  http: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    corsOrigins: process.env.CORS_ORIGINS ?? ''
  },
  database: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://cleanops:cleanops@localhost:5432/cleanops?schema=public'
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '1209600', 10)
  },
  s3: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
    bucket: process.env.MINIO_BUCKET ?? 'cleanops-media',
    region: process.env.MINIO_REGION ?? 'ap-southeast-2',
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'cleanops',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'cleanopssecret',
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT ?? 'http://localhost:9000'
  },
  openapi: {
    path: process.env.OPENAPI_PATH ?? 'infra/openapi/openapi.yaml'
  }
});
