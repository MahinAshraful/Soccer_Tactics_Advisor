import weaviate
from weaviate.classes.init import Auth
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Load credentials from .env
wcd_url = os.getenv("WEAVIATE_URL")
wcd_key = os.getenv("WEAVIATE_API_KEY")

# Load Reducto JSON
# Adjust the file path to your data directory
with open(
    "data/87a4d6cd-98c6-43a6-b504-0287c1223a4c.json",
    "r",
) as f:
    reducto_data = json.load(f)

# Connect to Weaviate Cloud
client = weaviate.connect_to_weaviate_cloud(
    cluster_url=wcd_url,
    auth_credentials=Auth.api_key(wcd_key),
)

collection = client.collections.get("Chunk")


# Helper function to extract formations from text
def extract_formations(text):
    formations = []
    common_formations = [
        "4-4-2",
        "4-3-3",
        "3-5-2",
        "4-2-3-1",
        "3-4-3",
        "5-3-2",
        "4-1-4-1",
    ]
    for formation in common_formations:
        if formation in text:
            formations.append(formation)
    return formations


# Helper function to identify tactic type
def identify_tactic_type(text):
    tactic_types = []
    if any(
        word in text.lower()
        for word in ["press", "pressing", "pressure", "gegenpressing"]
    ):
        tactic_types.append("pressing")
    if any(word in text.lower() for word in ["defend", "defensive", "defense"]):
        tactic_types.append("defensive")
    if any(
        word in text.lower() for word in ["attack", "attacking", "offense", "offensive"]
    ):
        tactic_types.append("attacking")
    if any(word in text.lower() for word in ["transition", "counter", "counterattack"]):
        tactic_types.append("transition")
    if any(word in text.lower() for word in ["possession", "build-up", "buildup"]):
        tactic_types.append("possession")
    return tactic_types


# Import chunks into Weaviate
with collection.batch.dynamic() as batch:
    for chunk in reducto_data["chunks"]:
        # Extract metadata to enhance retrieval
        formations = extract_formations(chunk["text"])
        tactic_types = identify_tactic_type(chunk["text"])

        # Add the chunk to Weaviate
        batch.add_object(
            properties={
                "content": chunk["text"],
                "title": chunk.get("title", ""),
                "section": chunk.get("section", ""),
                "formation": formations,
                "tactic_type": tactic_types,
                "page_num": chunk.get("page", 0),
            }
        )

    if batch.number_errors > 0:
        print(f"Batch import had {batch.number_errors} errors")

print(f"Imported {len(reducto_data['chunks'])} chunks into Weaviate")

client.close()
