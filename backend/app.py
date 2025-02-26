from flask import Flask, jsonify, request, Response
import json
from flask_cors import CORS
from Ollama import OllamaLLM
from validation_utils import ResponseValidator
import traceback
import time

app = Flask(__name__)
CORS(app)

# Initialize LLM and validator
llm = OllamaLLM(model_name="deepseek-r1:7b")
validator = ResponseValidator("./data/data.txt")

@app.route('/api/test', methods=['GET'])
def test_route():
    return jsonify({
        "status": "success",
        "message": "Soccer Tactics Advisor API is running"
    })

@app.route('/api/tactics', methods=['POST'])
def get_tactics():
    try:
        data = request.get_json()
        prompt = data.get('prompt')

        def generate():
            thinking = ""
            answer = ""
            keywords = []
            validation_result = {
                "accuracy_score": 0,
                "validation": "No matching context found in reference data"
            }
            thinking_just_completed = False  # Flag to track when thinking just completed
            
            try:
                for chunk in llm.generate_stream(prompt):
                    if chunk["type"] == "thinking":
                        thinking = chunk["content"]
                        # Only extract keywords when thinking is complete
                        if chunk.get("is_complete", False):
                            thinking_just_completed = True  # Mark that thinking just completed
                            try:
                                keywords = validator.extract_keywords(llm, thinking)
                            except Exception as e:
                                print(f"Error extracting keywords: {str(e)}")
                        
                        # Stream the thinking update immediately
                        yield json.dumps({
                            "status": "success",
                            "data": {
                                "thinking": thinking,
                                "answer": answer,
                                "accuracy_score": validation_result["accuracy_score"],
                                "validation_details": validation_result["validation"],
                                "keywords": keywords,
                                "update_type": "thinking",
                                "thinking_complete": chunk.get("is_complete", False)  # Signal completion
                            }
                        }) + '\n'
                    
                    # Process answer chunks
                    elif chunk["type"] == "answer":
                        # Use the current token as the delta
                        token = chunk["content"]
                        # Use the full_answer field for the complete answer so far
                        if "full_answer" in chunk:
                            answer = chunk["full_answer"]
                        else:
                            answer += token  # Fallback if full_answer not provided
                        
                        # Stream answer token updates
                        yield json.dumps({
                            "status": "success", 
                            "data": {
                                "thinking": thinking,
                                "answer": answer,
                                "token": token,  # Include the individual token
                                "accuracy_score": validation_result["accuracy_score"],
                                "validation_details": validation_result["validation"],
                                "keywords": keywords,
                                "update_type": "answer",
                                "prioritize_render": thinking_just_completed,  # Signal to prioritize rendering this update
                                "thinking_complete": thinking_just_completed  # Also signal that thinking just completed
                            }
                        }) + '\n'
                        
                        thinking_just_completed = False  # Reset the flag
                    
                    # When we get the done signal, run validation once and send final update
                    elif chunk["type"] == "done":
                        if keywords and answer:
                            contexts = [
                                ctx for keyword in keywords 
                                if (ctx := validator.get_context_window(keyword))
                            ]
                            if contexts:
                                try:
                                    validation_result = validator.validate_response(answer, contexts)
                                except Exception as e:
                                    print(f"Error validating response: {str(e)}")
                        
                        # Send final update with validation results
                        yield json.dumps({
                            "status": "success", 
                            "data": {
                                "thinking": thinking,
                                "answer": answer or chunk.get("content", ""),  # Use content from done chunk if available
                                "accuracy_score": validation_result["accuracy_score"],
                                "validation_details": validation_result["validation"],
                                "keywords": keywords,
                                "update_type": "final"
                            }
                        }) + '\n'

            except Exception as e:
                print(f"Error in generate stream: {str(e)}")
                print(traceback.format_exc())
                yield json.dumps({
                    "status": "error",
                    "message": str(e)
                }) + '\n'

        return Response(generate(), mimetype='application/json')

    except Exception as e:
        print(f"Error in /api/tactics: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": "Resource not found"
    }), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)