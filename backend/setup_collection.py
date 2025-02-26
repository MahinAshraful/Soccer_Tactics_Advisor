import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.config import Configure, DataType, Property
import os
from dotenv import load_dotenv

load_dotenv()

# Load credentials from .env
wcd_url = os.getenv("WEAVIATE_URL")
wcd_key = os.getenv("WEAVIATE_API_KEY")

# Connect to Weaviate Cloud
client = weaviate.connect_to_weaviate_cloud(
    cluster_url=wcd_url,
    auth_credentials=Auth.api_key(wcd_key),
)

print(f"Connected to Weaviate: {client.is_ready()}")

# Create Chunk collection for soccer tactics
try:
    client.collections.create(
        name="Chunk",
        vectorizer_config=[
            Configure.NamedVectors.text2vec_weaviate(
                name="content_vector",
                source_properties=["content", "title"],
                model="Snowflake/snowflake-arctic-embed-l-v2.0",
            )
        ],
        properties=[
            Property(name="content", data_type=DataType.TEXT),
            Property(name="title", data_type=DataType.TEXT),
            Property(name="section", data_type=DataType.TEXT),
            Property(name="formation", data_type=DataType.TEXT_ARRAY),
            Property(name="tactic_type", data_type=DataType.TEXT_ARRAY),
            Property(name="page_num", data_type=DataType.INT),
        ],
    )
    print("Created Chunk collection with soccer-specific properties")

except Exception as e:
    print(f"Error creating collection: {e}")

client.close()
