from minio import Minio

client = Minio('host.docker.internal:9000', access_key='forge_admin', secret_key='forge_secret', secure=False)

def clear_bucket(bucket_name):
    if client.bucket_exists(bucket_name):
        objects = client.list_objects(bucket_name, recursive=True)
        for obj in objects:
            client.remove_object(bucket_name, obj.object_name)
    print(f"Cleared {bucket_name}")

clear_bucket('raw-cad')
clear_bucket('processed-models')
