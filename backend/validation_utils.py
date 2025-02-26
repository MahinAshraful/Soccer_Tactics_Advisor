import re
from typing import List, Dict
import dspy
from Ollama import OllamaLLM

class ResponseValidator:
    def __init__(self, data_file_path: str):
        self.data_file_path = data_file_path
        with open(data_file_path, 'r') as f:
            self.reference_text = f.read()
        
    def extract_keywords(self, question: str) -> List[str]:
        """Extract keywords using local LLM"""
        prompt = f"Extract key tactical terms from this question: {question}\nReturn only the keywords separated by commas."
        response = OllamaLLM.generate_response(prompt)
        keywords = [k.strip() for k in response['answer'].split(',')]
        return keywords
    
    def get_context_window(self, keyword: str, window_size: int = 75) -> str:
        """Get text context around a keyword"""
        text = self.reference_text.lower()
        keyword = keyword.lower()
        
        matches = list(re.finditer(keyword, text))
        contexts = []
        
        for match in matches:
            start = max(0, match.start() - window_size)
            end = min(len(text), match.end() + window_size)
            context = self.reference_text[start:end]
            contexts.append(context)
            
        return '\n---\n'.join(contexts)
    
    def validate_response(self, answer: str, contexts: List[str]) -> Dict:
        """Validate response using DSPy"""
        lm = dspy.OpenAI(api_key="your-key")  # Or configure for local LLM
        
        class ValidateResponse(dspy.Signature):
            """Validate if the tactical advice matches reference contexts."""
            context = dspy.InputField(desc="Reference tactical contexts from database")
            answer = dspy.InputField(desc="LLM generated tactical advice")
            validation = dspy.OutputField(desc="Validation result with explanation")
            accuracy_score = dspy.OutputField(desc="Score from 0-100")
        
        validator = dspy.Predict(ValidateResponse)
        
        result = validator(
            context='\n'.join(contexts),
            answer=answer
        )
        
        return {
            "validation": result.validation,
            "accuracy_score": result.accuracy_score
        }