import os


def load_env_file(file_path=".env"):
    try:
        with open(file_path, "r") as file:
            for line in file:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()
    except FileNotFoundError:
        print(f"Warning: {file_path} file not found.")


# Load variables from .env file
load_env_file()

# Now get your API key
OPENAI_API_KEY = os.environ.get("OPENAI_KEY")
print(OPENAI_API_KEY)
