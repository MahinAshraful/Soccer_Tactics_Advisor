import re
from typing import List, Dict
import dspy
import os
from dotenv import load_dotenv
import google.generativeai as genai

def configure_gemini():
    """Configure Gemini API with environment variables."""
    load_dotenv()
    api_key = os.getenv("GEMINI_KEY")
    print(api_key)
    
    if not api_key:
        raise ValueError("GEMINI_KEY environment variable is not set")
    
    genai.configure(api_key=api_key)
    return api_key

if __name__ == "__main__":
    try:
        api_key = configure_gemini()
        # Remove or comment out this line in production
        # print(api_key)
    except ValueError as e:
        print(f"Error: {e}")