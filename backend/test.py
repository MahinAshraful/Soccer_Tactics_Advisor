from test2 import OllamaLLM

def main():
    llm = OllamaLLM(model_name="deepseek-r1:7b")
    
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
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()