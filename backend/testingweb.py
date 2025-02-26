import json
import os
from dotenv import load_dotenv
import weaviate

# Load environment variables
load_dotenv()

# Connect to Weaviate Cloud
wcd_url = os.getenv("WEAVIATE_URL")
wcd_key = os.getenv("WEAVIATE_API_KEY")

client = weaviate.WeaviateClient(
    url=wcd_url, auth_client_secret=weaviate.AuthApiKey(api_key=wcd_key)
)

if client.is_ready():
    print("Connected to Weaviate: True")
else:
    print("Failed to connect to Weaviate")

# Check if the collection exists
collection_name = "Chunk"
collections = client.schema.get()["classes"]
collection_exists = any(col["class"] == collection_name for col in collections)

if not collection_exists:
    try:
        client.schema.create_class(
            {
                "class": collection_name,
                "vectorizer": "text2vec-weaviate",
                "properties": [
                    {"name": "title", "dataType": ["string"]},
                    {"name": "description", "dataType": ["string"]},
                ],
            }
        )
        print("Created Chunk collection with soccer-specific properties")
    except Exception as e:
        print(f"Error creating collection: {e}")
else:
    print(f"Collection '{collection_name}' already exists")

# Load and insert data from JSON
try:
    with open("backend/data/87a4d6cd-98c6-43a6-b504-0287c1223a4c.json", "r") as file:
        data = json.load(file)
        # Insert data into the collection
        with client.batch as batch:
            for item in data:
                batch.add_data_object(item, collection_name)
                if batch.errors:
                    print("Batch import stopped due to errors.")
                    break
        if batch.errors:
            print(f"Number of failed imports: {len(batch.errors)}")
            print(f"First failed object: {batch.errors[0]}")
        else:
            print("Chunks inserted successfully.")
except Exception as e:
    print(f"Error loading or inserting data: {e}")

client.close()
