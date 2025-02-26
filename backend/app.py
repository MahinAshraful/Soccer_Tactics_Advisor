from flask import Flask, jsonify, request
from flask_cors import CORS
from Ollama import OllamaLLM
from validation_utils import ResponseValidator

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
        # Get prompt from request body
        data = request.get_json()
        prompt = data.get('prompt', "Suggest a tactical approach for a team playing against a 4-4-2 formation")

        #print(f"Received prompt: {prompt}")  # Debug log

        # Generate response
        response = llm.generate_response(prompt)
       # print(f"LLM Response: {response}")  # Debug log
        
        # Extract keywords and get contexts
        keywords = validator.extract_keywords(llm, prompt)
        #print(f"Extracted keywords: {keywords}")  # Debug log

        contexts = []
        for keyword in keywords:
            context = validator.get_context_window(keyword)
            if context:
                contexts.append(context)
        
        # Validate response if contexts are found
        validation_result = {
            "accuracy_score": 0,
            "validation": "No matching context found in reference data"
        }
        
        if contexts:
            validation_result = validator.validate_response(response["answer"], contexts)
        
        print(f"Validation result: {validation_result}")  # Debug log

        return jsonify({
            "status": "success",
            "data": {
                "thinking": response["thinking"],
                "answer": response["answer"],
                "accuracy_score": validation_result["accuracy_score"],
                "validation_details": validation_result["validation"],
                "keywords": keywords
            }
        })

    except Exception as e:
        print(f"Error in /api/tactics: {str(e)}")  # Detailed error logging
        import traceback
        print(traceback.format_exc())  # Print full stack trace
        return jsonify({
            "status": "error",
            "message": str(e),
            "trace": traceback.format_exc()
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": "Resource not found"
    }), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)