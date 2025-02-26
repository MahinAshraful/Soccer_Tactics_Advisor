from environs import Env

# Create env object
env = Env()

# Read .env file if it exists (optional)
env.read_env()

# Get your API key with a type
# The second parameter is the default value if the variable doesn't exist
OPENAI_API_KEY = env.str("OPENAI_KEY", "")

print(OPENAI_API_KEY)
