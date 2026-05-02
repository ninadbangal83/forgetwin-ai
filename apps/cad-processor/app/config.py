import os

class Config:
    API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:3001")
    INTERNAL_WEBHOOK_SECRET = os.getenv("INTERNAL_WEBHOOK_SECRET", "dev_secret_key_123")
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "forge_admin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "forge_secret")
    MINIO_SECURE = os.getenv("MINIO_SECURE", "False").lower() in ("true", "1", "t")

config = Config()
