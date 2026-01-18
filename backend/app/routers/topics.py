from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Topic
from app.services.llm import LLMService
import uuid

router = APIRouter(prefix="/topics", tags=["topics"])
llm_service = LLMService()

@router.get("/models")
async def list_available_models():
    """
    Returns a list of available Gemini models.
    """
    return await llm_service.list_models()

@router.post("/generate", response_model=Topic)
async def generate_topic_syllabus(
    prompt: str, 
    model_name: str | None = None,
    session: Session = Depends(get_session)
):
    """
    Generates a syllabus for the given prompt and saves it to the database.
    Returns the root Topic.
    """
    # 1. Generate JSON from LLM
    try:
        syllabus_data = await llm_service.generate_syllabus(prompt, model_name=model_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Generation failed: {str(e)}")

    # 2. Parse and Save to DB (Recursive function)
    
    def create_topic_recursive(data: dict, parent_id: uuid.UUID | None = None, order: int = 0) -> Topic:
        # Create the current topic
        topic = Topic(
            title=data["title"],
            description=data.get("description", ""),
            parent_id=parent_id,
            order_index=order
        )
        session.add(topic)
        session.commit() # Commit to get the ID
        session.refresh(topic)

        # Handle "modules" or "subtopics"
        children = data.get("modules", []) + data.get("subtopics", [])
        
        for i, child in enumerate(children):
            create_topic_recursive(child, parent_id=topic.id, order=i)
            
        return topic

    root_topic = create_topic_recursive(syllabus_data)
    session.refresh(root_topic)
    return root_topic

@router.get("/", response_model=List[Topic])
def read_topics(session: Session = Depends(get_session)):
    topics = session.exec(select(Topic)).all()
    return topics

@router.get("/{topic_id}", response_model=Topic)
def read_topic(topic_id: uuid.UUID, session: Session = Depends(get_session)):
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic
