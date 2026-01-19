from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Topic, Resource, ResourceType, Concept, Activity, ActivityType
from app.services.llm import LLMService
import uuid
import json

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
    
    # 2. Parse and Save to DB (Recursive function)
    root_topic = create_topic_recursive(session, syllabus_data)
    return root_topic

def create_topic_recursive(session: Session, data: dict, parent_id: uuid.UUID | None = None, order: int = 0) -> Topic:
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

    # Handle "subtopics"
    children = data.get("subtopics", [])
    
    for i, child in enumerate(children):
        create_topic_recursive(session, child, parent_id=topic.id, order=i)
        
    return topic

@router.post("/{topic_id}/elaborate", response_model=Topic)
async def elaborate_topic(
    topic_id: uuid.UUID,
    instruction: str = Body("", embed=True),
    model_name: str = Body(None, embed=True),
    session: Session = Depends(get_session)
):
    """
    Elaborates on a topic: updates description, adds sub-topics, adds resources.
    """
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    try:
        data = await llm_service.elaborate_topic(
            topic_title=topic.title, 
            current_description=topic.description or "", 
            instruction=instruction,
            model_name=model_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Elaboration failed: {str(e)}")

    # 1. Update Description
    if data.get("description"):
        topic.description = data["description"]
        session.add(topic)
    
    # 2. Add Subtopics (Find next order index)
    existing_children = session.exec(select(Topic).where(Topic.parent_id == topic.id)).all()
    next_order = len(existing_children)

    for sub in data.get("subtopics", []):
        create_topic_recursive(session, sub, parent_id=topic.id, order=next_order)
        next_order += 1

    # 3. Add Resources
    for res in data.get("resources", []):
        new_res = Resource(
            topic_id=topic.id,
            type=ResourceType.URL,
            path_or_url=res["url"],
            content_summary=f"Recommended: {res['title']}"
        )
        session.add(new_res)

    # 4. Add Concepts and Activities
    concepts_data = data.get("concepts", [])
    
    # Check existing concepts to append correctly (or we can just append)
    existing_concepts = session.exec(select(Concept).where(Concept.topic_id == topic.id)).all()
    concept_order = len(existing_concepts)

    for concept_data in concepts_data:
        new_concept = Concept(
            title=concept_data["title"],
            description=concept_data.get("description", ""),
            topic_id=topic.id,
            order_index=concept_order
        )
        session.add(new_concept)
        session.commit() # Commit to get concept ID
        session.refresh(new_concept)
        concept_order += 1

        # Add activities for this concept
        for activity_data in concept_data.get("activities", []):
            # Validate activity type (simple fallback)
            act_type = activity_data.get("type", "read")
            # Map string to Enum if needed, but Pydantic/SQLModel usually handles strings if they match values
            
            new_activity = Activity(
                concept_id=new_concept.id,
                type=act_type,
                instructions=activity_data.get("instructions", ""),
                content=json.dumps(activity_data.get("content", "")) if isinstance(activity_data.get("content"), (dict, list)) else activity_data.get("content", "")
            )
            session.add(new_activity)

    session.commit()
    session.refresh(topic)
    return topic

@router.post("/{topic_id}/ask")
async def ask_topic(
    topic_id: uuid.UUID,
    question: str = Body(..., embed=True),
    model_name: str = Body(None, embed=True),
    session: Session = Depends(get_session)
):
    """
    Ask a question about the topic. Returns a plain text answer.
    """
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    answer = await llm_service.chat_with_topic(
        topic_title=topic.title,
        context=topic.description or "",
        question=question,
        model_name=model_name
    )
    return {"answer": answer}

@router.patch("/{topic_id}/status", response_model=Topic)
def update_topic_status(
    topic_id: uuid.UUID,
    status: str, # We'll validate this against the enum or let Pydantic handle it if we used the schema
    session: Session = Depends(get_session)
):
    """
    Updates the status of a topic (e.g. pending -> completed).
    """
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Simple validation, though Pydantic would be better if we had a Request model
    if status not in ["pending", "completed"]:
         raise HTTPException(status_code=400, detail="Invalid status")
         
    topic.status = status
    session.add(topic)
    session.commit()
    session.refresh(topic)
    return topic

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
