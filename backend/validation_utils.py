import re
from typing import List, Dict
import dspy
import os

# Add this helper function to escape regex special characters
def escape_regex_special_chars(text):
    """Escape special regex characters in a string to use it safely in regex patterns"""
    special_chars = r'[\^$.|?*+(){}[]'
    for char in special_chars:
        text = text.replace(char, '\\' + char)
    return text

class ResponseValidator:
    def __init__(self, data_file_path: str):
        self.data_file_path = data_file_path
        with open(data_file_path, 'r') as f:
            self.reference_text = f.read()
        
    def extract_keywords(self, lm,  question: str) -> List[str]:
        """Extract keywords using local LLM"""
        prompt = f"Extract key tactical terms from this question: {question}\nReturn only the keywords separated by commas."
        response = lm.generate_response(prompt)
        keywords = [k.strip() for k in response['answer'].split(',')]
        return keywords
    
    def get_context_window(self, keyword, window_size=200):
        """Get the text surrounding a keyword for context"""
        if not keyword or not self.reference_text:
            return None
        
        # Escape special regex characters in keyword before using in regex
        escaped_keyword = escape_regex_special_chars(keyword)
        
        try:
            matches = list(re.finditer(escaped_keyword, self.reference_text, re.IGNORECASE))
            if not matches:
                return None
            
            # Get the first match
            match = matches[0]
            start_pos = max(0, match.start() - window_size)
            end_pos = min(len(self.reference_text), match.end() + window_size)
            
            return self.reference_text[start_pos:end_pos]
        except Exception as e:
            print(f"Error finding keyword context: {str(e)}")
            return None
    
    def validate_response(self, answer: str, contexts: List[str]) -> Dict:
        """Validate response using DSPy"""
        # Update OpenAI configuration
        lm = dspy.LM('ollama_chat/deepseek-r1:1.5b', api_base='http://localhost:11434', api_key='')
        dspy.configure(lm=lm)
        
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