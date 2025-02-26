import requests
import re

class OllamaLLM:
    def __init__(self, model_name="deepseek-r1:7b"):
        self.base_url = "http://localhost:11434/api"
        self.model_name = model_name

    def generate_response(self, prompt: str) -> dict:
        """
        Generate a response using the local Ollama model and parse thinking and answer
        """
        response = requests.post(
            f"{self.base_url}/generate",
            json={
                "model": self.model_name,
                "prompt": prompt,
                "stream": False
            }
        )
        
        if response.status_code == 200:
            raw_response = response.json()["response"]
            
            # Parse thinking and answer
            thinking = ""
            answer = raw_response
            
            # Extract content between <think> tags
            think_match = re.search(r'<think>(.*?)</think>', raw_response, re.DOTALL)
            if think_match:
                thinking = think_match.group(1).strip()
                # Get everything after </think> tag as the answer
                answer = raw_response.split('</think>')[-1].strip()
            
            return {
                "thinking": thinking,
                "answer": answer
            }
        else:
            raise Exception(f"Error generating response: {response.text}")

    def list_available_models(self) -> list:
        """Get a list of available models"""
        response = requests.get(f"{self.base_url}/tags")
        if response.status_code == 200:
            return [model["name"] for model in response.json()["models"]]
        else:
            raise Exception(f"Error listing models: {response.text}")