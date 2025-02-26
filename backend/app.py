from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/test', methods=['GET'])
def test_route():
    return jsonify({
        "status": "success",
        "message": "Soccer Tactics Advisor API is running"
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": "Resource not found"
    }), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)