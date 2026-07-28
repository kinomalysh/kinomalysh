import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

interface StorageConfig {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle: boolean
}

function readConfig(): StorageConfig | null {
  const {
    S3_ENDPOINT,
    S3_REGION,
    S3_BUCKET,
    S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY,
    S3_FORCE_PATH_STYLE,
  } = process.env
  if (!S3_ENDPOINT || !S3_REGION || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    return null
  }
  return {
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    bucket: S3_BUCKET,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    forcePathStyle: S3_FORCE_PATH_STYLE !== 'false',
  }
}

const config = readConfig()

export const isStorageConfigured = config !== null

let client: S3Client | null = null

function getClient(cfg: StorageConfig): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      forcePathStyle: cfg.forcePathStyle,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    })
  }
  return client
}

function requireConfig(): StorageConfig {
  if (!config) throw new Error('S3 storage is not configured')
  return config
}

export async function uploadObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const cfg = requireConfig()
  await getClient(cfg).send(
    new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: body, ContentType: contentType }),
  )
}

interface PresignOptions {
  expiresIn?: number
  downloadFilename?: string
}

export async function presignGet(key: string, options: PresignOptions = {}): Promise<string> {
  const cfg = requireConfig()
  const command = new GetObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ResponseContentDisposition: options.downloadFilename
      ? `attachment; filename="${options.downloadFilename}"`
      : undefined,
  })
  return getSignedUrl(getClient(cfg), command, { expiresIn: options.expiresIn ?? 3600 })
}

export async function getObject(key: string): Promise<Uint8Array> {
  const cfg = requireConfig()
  const res = await getClient(cfg).send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }))
  if (!res.Body) throw new Error(`объект ${key} пуст`)
  return new Uint8Array(await res.Body.transformToByteArray())
}

export async function deleteObject(key: string): Promise<void> {
  const cfg = requireConfig()
  await getClient(cfg).send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }))
}
