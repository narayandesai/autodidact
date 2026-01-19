import os
import json
import google.generativeai as genai
from typing import List, Dict, Any
from app.prompts import syllabus_prompt, summary_prompt, elaboration_prompt, chat_prompt, concepts_prompt, activities_prompt

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

        prompt = syllabus_prompt(topic)

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
            "subtopics": [
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
            
        prompt = summary_prompt(text)
        
        try:
            model = self.get_model(model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error summarizing text: {e}")
            return "Error generating summary."

    async def elaborate_topic(self, topic_title: str, current_description: str, instruction: str = "", model_name: str | None = None) -> Dict[str, Any]:
        """
        Generates a detailed expansion of a topic, including better description, 
        sub-topics, and external resources.
        """
        if not API_KEY:
            return {
                "description": f"Mock elaborated description for {topic_title}.",
                "concepts": [
                    {
                        "title": "Mock Concept 1",
                        "description": "A fundamental mock concept.",
                        "activities": [
                            {"type": "read", "instructions": "Read this mock text.", "content": "Mock reading content."},
                            {"type": "quiz", "instructions": "Take this mock quiz.", "content": {"question": "Is this a mock?", "options": ["Yes", "No"], "correct": "Yes"}}
                        ]
                    }
                ],
                "subtopics": [{"title": "Mock Subtopic", "description": "Mock desc"}],
                "resources": [{"title": "Mock Wiki", "url": "http://example.com", "type": "url"}]
            }

        prompt = elaboration_prompt(topic_title, current_description, instruction)

        try:
            model = self.get_model(model_name)
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            print(f"Error elaborating topic: {e}")
            raise e

    async def chat_with_topic(self, topic_title: str, context: str, question: str, model_name: str | None = None) -> str:
        """
        Answers a user question based on the topic context.
        """
        if not API_KEY:
            return f"Mock answer to '{question}' regarding {topic_title}."

        prompt = chat_prompt(topic_title, context, question)
        
        try:
            model = self.get_model(model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error answering question: {e}"
        except Exception as e:
            return f"Error answering question: {e}"

    async def generate_concepts(self, topic_title: str, description: str, model_name: str | None = None) -> List[Dict[str, Any]]:
        """
        Generates a list of concepts for a topic.
        """
        if not API_KEY:
            return [
                {"title": "Mock Concept A", "description": "Desc A", "order_index": 1},
                {"title": "Mock Concept B", "description": "Desc B", "order_index": 2}
            ]

        prompt = concepts_prompt(topic_title, description)
        try:
            model = self.get_model(model_name)
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            print(f"Error generating concepts: {e}")
            raise e

    async def generate_activities(self, concept_title: str, context: str, model_name: str | None = None) -> List[Dict[str, Any]]:
        """
        Generates a list of activities for a concept.
        """
        if not API_KEY:
             return [
                {"type": "read", "instructions": "Read Mock", "content": "Mock Content", "status": "pending"},
                {"type": "quiz", "instructions": "Quiz Mock", "content": {"question":"?"}, "status": "pending"}
            ]
        
        prompt = activities_prompt(concept_title, context)
        try:
            model = self.get_model(model_name)
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            print(f"Error generating activities: {e}")
            raise e
