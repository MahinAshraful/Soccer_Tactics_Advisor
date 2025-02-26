import os
from dotenv import load_dotenv

load_dotenv()

OpenAI_API_KEY = os.getenv("OPENAI_KEY")

print(OpenAI_API_KEY)
