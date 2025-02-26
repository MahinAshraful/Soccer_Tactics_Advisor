from Ollama import OllamaLLM
from validation_utils import ResponseValidator



#OpenAI_API_KEY = os.getenv("OPENAI_API")

def main():
    
    llm = OllamaLLM(model_name="deepseek-r1:7b")
    validator = ResponseValidator("./data/data.txt")
    
    # Test prompt
    test_prompt = "Suggest a tactical approach for a team playing against a 4-4-2 formation"
    
    try:
        print("Testing LLM connection...")
        print("\nAvailable models:")
        models = llm.list_available_models()
        print(models)
        
        print("\nGenerating response...")
        response = llm.generate_response(test_prompt)
        
        print("\nThinking Process:")
        print(response["thinking"])
        
        print("\nFinal Answer:")
        print(response["answer"])
        
        # Validate response
        print("\nValidating response...")
        keywords = validator.extract_keywords(llm, test_prompt)
        print(f"Extracted keywords: {keywords}")
        
        contexts = []
        for keyword in keywords:
            context = validator.get_context_window(keyword)
            if context:
                contexts.append(context)
        
        if contexts:
            validation_result = validator.validate_response(response["answer"], contexts)
            print("\nValidation Results:")
            print(f"Accuracy Score: {validation_result['accuracy_score']}")
            print(f"Validation Details: {validation_result['validation']}")
        else:
            print("No matching context found in reference data")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()