# Soccer Tactics Advisor

A real-time AI soccer coaching assistant that provides tactical analysis, training recommendations, and strategic advice. This application combines a React/Next.js frontend with a Python Flask backend that leverages locally-run LLM models to provide contextual soccer coaching insights.

## Features

- **Tactical Analysis**: Get expert analysis on soccer formations, game plans, and team strategies
- **Real-Time Advice**: Ask questions and receive immediate tactical insights based on validated soccer knowledge
- **Training Drills**: Access training exercises designed to improve specific aspects of team performance
- **Strategic Planning**: Plan approaches to upcoming matches with personalized strategy recommendations
- **Transparent AI**: View the AI's thought process alongside its final recommendations

## Technical Overview

### Frontend
- Next.js React application with TypeScript
- Responsive UI using Tailwind CSS
- Streaming response handling for real-time updates
- Markdown rendering for formatted responses

### Backend
- Flask API server with CORS support
- Integration with locally-run LLM models using Ollama
- Response validation with DSPy framework
- Streaming response architecture
- Context-aware responses using reference knowledge base

## Getting Started

### Prerequisites

- Node.js (v16+) and npm
- Python 3.8+ and pip
- Git
- Ollama (for running local LLM models)

### System Requirements

Based on the LLM model being used, the following system specifications are recommended:

- **Minimum**: 8GB RAM, modern quad-core CPU, 20GB free disk space
- **Recommended**: 16GB RAM, 8-core CPU, 40GB free disk space
- **Optimal**: 32GB+ RAM, modern 8+ core CPU, 100GB+ SSD storage

The default configuration uses `deepseek-r1:7b` which requires approximately:
- 8-16GB RAM for inference
- 4-8GB disk space for the model

## Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/Soccer_Tactics_Advisor.git
cd Soccer_Tactics_Advisor
```

### Step 2: Set Up the Backend

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Install and Set Up Ollama

1. Download and install Ollama from [ollama.ai](https://ollama.ai)
2. Pull the required model:
```bash
ollama pull deepseek-r1:7b
```
This may take some time depending on your internet connection.

### Step 4: Create Reference Data File

Create a data.txt file in the backend/data directory with your soccer tactics reference information.

```bash
mkdir -p backend/data
touch backend/data/data.txt
```

Add comprehensive soccer tactics information to this file as it serves as the knowledge base for the AI.

### Step 5: Set Up the Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

## Running the Application

### Step 1: Start Ollama Service

Make sure the Ollama service is running in the background:

```bash
ollama serve
```

### Step 2: Start the Backend Server

```bash
# In the backend directory, with virtual environment activated
cd backend
flask run
```

The backend will start on http://localhost:5000

### Step 3: Start the Frontend Development Server

```bash
# In the frontend directory
cd frontend
npm run dev
```

The frontend will start on http://localhost:3000

### Step 4: Access the Application

Open your browser and navigate to:
- http://localhost:3000

## Usage Tips

1. Start with specific questions about soccer tactics
2. View the AI's thinking process to understand its reasoning
3. Note the confidence score to gauge the reliability of responses
4. Use the "New Conversation" button to reset the chat
5. For complex tactical questions, provide context about the team, opponent, or specific scenario

## Adjusting for Performance

If you experience performance issues:

### For Lower-end Systems (8GB RAM)
- In Ollama.py, change the model to a smaller variant:
```python
def __init__(self, model_name="deepseek-r1:1.5b"):
```

### For Mid-Tier Systems (16GB - 24GB RAM)
- You can use larger models for better quality:
```python
def __init__(self, model_name="deepseek-r1:7b"):
```
#### or

```python
def __init__(self, model_name="deepseek-r1:14b"):
```

### For Higher-end Systems (32GB+ RAM)
- You can use larger models for better quality:
```python
def __init__(self, model_name="deepseek-r1:34b"):
```

## Troubleshooting

- **Backend Not Connecting**: Ensure Ollama service is running with `ollama serve`
- **Model Loading Errors**: Check if you have enough RAM for the selected model
- **Slow Responses**: Consider switching to a smaller model or optimizing system resources

## License

This project is licensed under the MIT License - see the LICENSE file for details.
