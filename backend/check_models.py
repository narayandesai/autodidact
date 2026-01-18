import os
import google.generativeai as genai

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("No API KEY found in env.")
else:
    genai.configure(api_key=API_KEY)
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
    except Exception as e:
        print(f"Error listing models: {e}")
