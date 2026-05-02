from minio import Minio
from app.config import config
import io

class StorageService:
    def __init__(self):
        self.client = Minio(
            config.MINIO_ENDPOINT,
            access_key=config.MINIO_ACCESS_KEY,
            secret_key=config.MINIO_SECRET_KEY,
            secure=config.MINIO_SECURE
        )

    def download_file(self, bucket: str, key: str, local_path: str):
        self.client.fget_object(bucket, key, local_path)

    def upload_file(self, bucket: str, key: str, data: bytes, content_type: str = "application/octet-stream"):
        self.client.put_object(
            bucket,
            key,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type
        )

storage_service = StorageService()
