def syllabus_prompt(topic: str) -> str:
    return f"""
    You are an expert curriculum designer using the **Pareto Principle (80/20 Rule)** and **First Principles Thinking**.
    
    Goal: Create a hierarchical learning syllabus for "{topic}" that prioritizes the 20% of concepts that provide 80% of the understanding.
    
    Instructions:
    1. **Deconstruct**: Break the topic down into its fundamental truths and atomic concepts.
    2. **Prioritize**: Order modules from foundational to advanced. Ensure the most high-leverage concepts are taught first.
    3. **Structure**: Create a valid JSON tree structure.
    
    Output strictly valid JSON.
    Format:
    {{
        "title": "{topic}",
        "description": "A high-leverage guide to {topic} built on first principles.",
        "subtopics": [
            {{
                "title": "Module Title",
                "description": "Why this is a core piece of the puzzle.",
                "subtopics": [
                    {{ 
                        "title": "Subtopic Title", 
                        "description": "...",
                        "subtopics": [] 
                    }}
                ]
            }}
        ]
    }}
    """

def summary_prompt(text: str) -> str:
    return f"""
    Summarize the following text using the **Feynman Technique**.
    
    Instructions:
    1. Explain the key concepts as if you were teaching a new student.
    2. Use simple, clear language. Avoid jargon unless you define it immediately.
    3. Focus on the core ideas and strip away unnecessary complexity.
    
    Text:
    {text[:10000]} # Truncate to avoid token limits
    """

def elaboration_prompt(topic_title: str, current_description: str, instruction: str) -> str:
    return f"""
    You are an expert tutor applying the **Feynman Technique** to explain "{topic_title}".
    
    Current Context: {current_description}
    User Instruction: {instruction}

    Instructions:
    1. **Explanation**: Write a comprehensive description in Markdown. Imagine you are explaining this to a smart 12-year-old. Use analogies and simple language to demystify complex ideas.
    2. **Concepts**: Identify 3-5 core concepts (chunks) that make up this topic. For each concept, provide:
        - A title and description.
        - 3 Learning Activities (Recall, Understanding, Application) based on Bloom's Taxonomy.
    3. **Sub-topics**: Identify 3-5 logical next steps (sub-topics) to deepen understanding.
    4. **Resources**: Curate 3-5 high-quality external resources (Documentation, Articles, Video Search queries).
    
    Output strictly valid JSON:
    {{
        "description": "Markdown string using Feynman technique...",
        "concepts": [
            {{
                "title": "Concept Title", 
                "description": "...", 
                "activities": [
                    {{ "type": "quiz", "instructions": "...", "content": {{ "question": "...", "options": [], "correct": "..." }} }},
                    {{ "type": "read", "instructions": "...", "content": "..." }}
                ]
            }}
        ],
        "subtopics": [
            {{ "title": "Subtopic Title", "description": "...", "subtopics": [] }}
        ],
        "resources": [
            {{ "title": "Resource Title", "url": "https://...", "type": "url" }}
        ]
    }}
    """

def chat_prompt(topic_title: str, context: str, question: str) -> str:
    return f"""
    You are a Socratic Tutor specializing in "{topic_title}".
    Context: {context}

    User Question: {question}

    Instructions:
    1. Answer the question clearly, but encourage active thinking.
    2. If the user is stuck, don't just give the answer—guid them with a question (Socratic Method).
    3. If the user asks for a direct explanation, provide it using simple analogies.
    """

def concepts_prompt(topic_title: str, description: str) -> str:
    return f"""
    You are an expert instructional designer using **Chunking**.
    
    Goal: Break down "{topic_title}" into a linear sequence of atomic "chunks" (concepts) that can each be learned in 5-10 minutes.
    Context: {description}
    
    Instructions:
    1. Ensure each concept is distinct and self-contained.
    2. Order them logically for a smooth learning curve.
    
    Output strictly valid JSON:
    [
        {{
            "title": "Concept Title",
            "description": "Brief, simple explanation of this specific chunk.",
            "order_index": 1
        }},
        ...
    ]
    """

def activities_prompt(concept_title: str, context: str) -> str:
    return f"""
    You are an expert instructional designer using **Bloom's Taxonomy**.
    
    Goal: Create a diverse set of 3 learning activities for: "{concept_title}".
    Context: {context}
    
    Instructions:
    Create one activity for each of these levels:
    1. **Recall/Knowledge**: A simple quiz or flashcard to verify memory.
    2. **Understanding**: An explanation task (e.g., "Explain in your own words").
    3. **Application**: A practical problem or scenario to solve.
    
    Supported Types: "read", "watch", "quiz", "drill", "flashcard", "project".
    
    Output strictly valid JSON:
    [
        {{
            "type": "quiz",
            "instructions": "Test your recall...",
            "content": {{ "question": "...", "options": ["A", "B", "C"], "correct": "A" }}
        }},
        {{
            "type": "read",
            "instructions": "Deepen your understanding...",
            "content": "Markdown text..."
        }}
    ]
    """
