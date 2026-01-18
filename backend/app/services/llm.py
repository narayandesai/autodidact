import os
import json
import google.generativeai as genai
from typing import List, Dict, Any

# Configure the API key
API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

class LLMService:
    def __init__(self):
        self.default_model = 'gemini-1.5-flash'

    def get_model(self, model_name: str | None = None):
        name = model_name or self.default_model
        return genai.GenerativeModel(name)

    async def list_models(self) -> List[Dict[str, str]]:
        """
        Lists available models that support content generation.
        """
        if not API_KEY:
            return [{"name": "mock-model", "display_name": "Mock Model (No API Key)"}]
        
        try:
            models = []
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    models.append({
                        "name": m.name,
                        "display_name": m.display_name
                    })
            return models
        except Exception as e:
            print(f"Error listing models: {e}")
            return []

    async def generate_syllabus(self, topic: str, model_name: str | None = None) -> Dict[str, Any]:
        """
        Generates a hierarchical syllabus for a given topic using Gemini.
        Returns a JSON dictionary representing the tree.
        """
        if not API_KEY:
             # Fallback mock for when no key is present (useful for testing/dev without credentials)
            return self._mock_syllabus(topic)

        prompt = f"""
        You are an expert curriculum designer. Create a comprehensive, hierarchical learning syllabus for the topic: "{topic}".
        
        Output strictly valid JSON. The structure should be a list of modules, where each module has a title, description, and a list of sub-topics.
        
        Format:
        {{
            "title": "{topic}",
            "description": "A comprehensive guide to {topic}",
            "modules": [
                {{
                    "title": "Module 1 Title",
                    "description": "Brief description",
                    "subtopics": [
                        {{ "title": "Subtopic 1", "description": "..." }},
                        ...
                    ]
                }},
                ...
            ]
        }}
        """

        try:
            model = self.get_model(model_name)
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            print(f"Error generating syllabus with {model_name or self.default_model}: {e}")
            raise e

    def _mock_syllabus(self, topic: str) -> Dict[str, Any]:
        # ... (keep existing mock code)
        return {
            "title": topic,
            "description": f"Mock syllabus for {topic} (No API Key found)",
            "modules": [
                {
                    "title": "Fundamentals",
                    "description": "Basic concepts.",
                    "subtopics": [
                        {"title": "History", "description": "Origins."},
                        {"title": "Core Theory", "description": "How it works."}
                    ]
                },
                {
                    "title": "Advanced Application",
                    "description": "Moving forward.",
                    "subtopics": [
                        {"title": "Case Studies", "description": "Real world examples."}
                    ]
                }
            ]
        }

    async def summarize_text(self, text: str, model_name: str | None = None) -> str:
        """
        Summarizes the provided text into key concepts.
        """
        if not API_KEY:
            return "Mock summary: Key concepts include X, Y, and Z. (No API Key)"
            
        prompt = f"""
        Summarize the following text into key learning concepts suitable for a student.
        Keep it concise and structured.
        
        Text:
        {text[:10000]} # Truncate to avoid token limits for now
        """
        
        try:
            model = self.get_model(model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error summarizing text: {e}")
            return "Error generating summary."
