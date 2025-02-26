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
            validation_run = False  # Flag to track if validation has been run
            validation_result = {
                "accuracy_score": 0,
                "validation": "No matching context found in reference data"
            }
            
            try:
                for chunk in llm.generate_stream(prompt):
                    if chunk["type"] == "thinking":
                        thinking = chunk["content"]
                        # Only extract keywords when thinking is complete
                        if chunk.get("is_complete", False):
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
                                "update_type": "thinking"  # Mark update type
                            }
                        }) + '\n'
                    
                    # Process answer chunks
                    elif chunk["type"] == "answer":
                        answer = chunk["content"]  # Replace with full answer so far
                        
                        # Check if this is the final answer chunk by looking for "done" flag in the data
                        is_final_chunk = False
                        
                        # Stream answer updates immediately with clear distinction
                        yield json.dumps({
                            "status": "success", 
                            "data": {
                                "thinking": thinking,
                                "answer": answer,
                                "accuracy_score": validation_result["accuracy_score"],
                                "validation_details": validation_result["validation"],
                                "keywords": keywords,
                                "update_type": "answer",  # Mark update type
                                "is_final": is_final_chunk
                            }
                        }) + '\n'
                
                # After the entire stream is completed, run validation once
                if keywords and answer and not validation_run:
                    validation_run = True
                    contexts = [
                        ctx for keyword in keywords 
                        if (ctx := validator.get_context_window(keyword))
                    ]
                    if contexts:
                        try:
                            validation_result = validator.validate_response(answer, contexts)
                            # Make sure accuracy_score is a number
                            if validation_result["accuracy_score"]:
                                try:
                                    # Parse to number if it's a string
                                    if isinstance(validation_result["accuracy_score"], str):
                                        validation_result["accuracy_score"] = float(validation_result["accuracy_score"].replace('%', ''))
                                except:
                                    validation_result["accuracy_score"] = 0
                        except Exception as e:
                            print(f"Error validating response: {str(e)}")
                
                    # Send final message with validation results
                    yield json.dumps({
                        "status": "success", 
                        "data": {
                            "thinking": thinking,
                            "answer": answer,
                            "accuracy_score": validation_result["accuracy_score"],
                            "validation_details": validation_result["validation"],
                            "keywords": keywords,
                            "update_type": "final"  # Mark this as the final update with validation
                        }
                    }) + '\n'

            except Exception as e:
                print(f"Error in generate stream: {str(e)}")
                yield json.dumps({
                    "status": "error",
                    "message": str(e)
                }) + '\n'

        return Response(generate(), mimetype='application/json')

    except Exception as e:
        print(f"Error in /api/tactics: {str(e)}")
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