def syllabus_prompt(topic: str) -> str:
    return f"""
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

def summary_prompt(text: str) -> str:
    return f"""
    Summarize the following text into key learning concepts suitable for a student.
    Keep it concise and structured.
    
    Text:
    {text[:10000]} # Truncate to avoid token limits for now
    """

def elaboration_prompt(topic_title: str, current_description: str, instruction: str) -> str:
    return f"""
    You are an expert tutor. I need you to flesh out the learning topic: "{topic_title}".
    Current Context: {current_description}
    User Instruction: {instruction}

    Please provide:
    1. A comprehensive, detailed description (in Markdown) that explains the core concepts.
    2. A list of 3-5 logical sub-topics (modules) to deepen understanding (with brief descriptions).
    3. A list of 3-5 high-quality external learning resources. 
       - Prioritize specific Wikipedia pages, official documentation, or high-quality articles.
       - For videos, you can provide a YouTube Search URL like "https://www.youtube.com/results?search_query=..."
    
    Output strictly valid JSON with this structure:
    {{
        "description": "Markdown string...",
        "subtopics": [
            {{ "title": "Subtopic Title", "description": "..." }}
        ],
        "resources": [
            {{ "title": "Resource Title", "url": "https://...", "type": "url" }}
        ]
    }}
    """

def chat_prompt(topic_title: str, context: str, question: str) -> str:
    return f"""
    You are a helpful tutor specializing in "{topic_title}".
    Context: {context}

    User Question: {question}

    Answer clear, concisely, and helpfully.
    """
