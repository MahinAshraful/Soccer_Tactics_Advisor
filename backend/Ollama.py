import requests
import re
import json
from typing import Generator, Dict

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

    def generate_stream(self, prompt: str) -> Generator[Dict, None, None]:
        """
        Stream both thinking and answer parts word by word for a smooth live experience
        """
        response = requests.post(
            f"{self.base_url}/generate",
            json={
                "model": self.model_name,
                "prompt": "First show your thinking process surrounded by <think> tags, then provide your final answer.\n\nQuestion: " + prompt,
                "stream": True
            },
            stream=True
        )
        
        if response.status_code != 200:
            raise Exception(f"Error generating response: {response.text}")

        accumulated_buffer = ""
        thinking_complete = False
        answer_text = ""
        
        try:
            for line in response.iter_lines():
                if not line:
                    continue

                try:
                    data = json.loads(line.decode('utf-8'))
                except json.JSONDecodeError:
                    continue

                if "response" not in data:
                    continue

                token = data["response"]
                accumulated_buffer += token
                
                # Check if this token completes a thinking section
                if not thinking_complete and "</think>" in accumulated_buffer:
                    # Fixed regex pattern
                    think_match = re.search(r'<think>(.*?)</think>', accumulated_buffer, re.DOTALL)
                    if think_match:
                        thinking = think_match.group(1).strip()
                        remaining = accumulated_buffer.split('</think>', 1)[-1].strip()
                        thinking_complete = True
                        
                        yield {
                            "type": "thinking",
                            "content": thinking,
                            "is_complete": True
                        }
                        
                        # If there's any remaining content after the thinking section,
                        # immediately yield it as the start of the answer
                        if remaining:
                            answer_text = remaining
                            yield {
                                "type": "answer",
                                "content": token, # Just send the latest token
                                "full_answer": answer_text # Include full answer for reference
                            }
                        accumulated_buffer = ""
                
                # If we're in the thinking section but not complete yet
                elif not thinking_complete and "<think>" in accumulated_buffer:
                    # Stream partial thinking updates
                    if accumulated_buffer.startswith("<think>"):
                        thinking_content = accumulated_buffer[7:]  # Remove "<think>" prefix
                    else:
                        parts = accumulated_buffer.split("<think>", 1)
                        thinking_content = parts[1] if len(parts) > 1 else ""
                    
                    yield {
                        "type": "thinking",
                        "content": thinking_content,
                        "is_complete": False
                    }
                
                # If thinking is complete, stream each token as it comes for answer
                elif thinking_complete:
                    answer_text += token  # Add new token to answer
                    # Send individual token updates for smoother streaming
                    yield {
                        "type": "answer",
                        "content": token,  # Send just the latest token
                        "full_answer": answer_text  # Include full answer for reference
                    }
                
                # If no thinking tags yet and we've accumulated enough text
                elif len(accumulated_buffer) > 15 and "<think>" not in accumulated_buffer:
                    answer_text = accumulated_buffer  # Set this as the answer
                    yield {
                        "type": "answer",
                        "content": token,  # Send just the latest token
                        "full_answer": answer_text  # Include full answer for reference
                    }
                    accumulated_buffer = ""
            
            # Final check for any remaining content
            if accumulated_buffer and not thinking_complete:
                if "<think>" in accumulated_buffer:
                    # Fixed regex here too - use safe string splitting instead
                    parts = accumulated_buffer.split("<think>", 1)
                    thinking_content = parts[1] if len(parts) > 1 else ""
                    yield {
                        "type": "thinking",
                        "content": thinking_content,
                        "is_complete": False
                    }
                else:
                    final_token = accumulated_buffer
                    answer_text += final_token
                    yield {
                        "type": "answer",
                        "content": final_token,  # Send just the latest token
                        "full_answer": answer_text  # Include full answer for reference
                    }
            
            # Send a final chunk to indicate completion
            yield {
                "type": "done",
                "content": answer_text,  # Include the final answer here as well
                "is_complete": True
            }
        
        except Exception as e:
            print(f"Stream error: {str(e)}")
            raise Exception(f"Error in stream processing: {str(e)}")

    def list_available_models(self) -> list:
        """Get a list of available models"""
        response = requests.get(f"{self.base_url}/tags")
        if response.status_code == 200:
            return [model["name"] for model in response.json()["models"]]
        else:
            raise Exception(f"Error listing models: {response.text}")