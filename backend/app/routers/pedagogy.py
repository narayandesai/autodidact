from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List, Optional
from app.database import get_session
from app.models import Topic, Concept, Activity, ActivityStatus, ActivityType
from app.services.llm import LLMService
import uuid
import json

router = APIRouter(tags=["pedagogy"])
llm_service = LLMService()

# --- CONCEPTS ---

@router.get("/concepts/", response_model=List[Concept])
def read_concepts(topic_id: uuid.UUID, session: Session = Depends(get_session)):
    """
    List concepts for a specific topic, ordered by order_index.
    """
    statement = select(Concept).where(Concept.topic_id == topic_id).order_by(Concept.order_index)
    results = session.exec(statement).all()
    return results

@router.post("/concepts/generate", response_model=List[Concept])
async def generate_concepts(
    topic_id: uuid.UUID = Body(..., embed=True),
    model_name: str = Body(None, embed=True),
    session: Session = Depends(get_session)
):
    """
    Generates concepts for a topic using AI.
    """
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Generate concepts
    try:
        concepts_data = await llm_service.generate_concepts(
            topic_title=topic.title,
            description=topic.description or "",
            model_name=model_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Generation failed: {str(e)}")

    # Clear existing concepts? Or append? For now, we'll append/overwrite order.
    # Let's just add them.
    
    new_concepts = []
    # Find max order index
    existing_concepts = session.exec(select(Concept).where(Concept.topic_id == topic_id)).all()
    current_max_order = max([c.order_index for c in existing_concepts]) if existing_concepts else 0
    
    for item in concepts_data:
        concept = Concept(
            topic_id=topic.id,
            title=item["title"],
            description=item.get("description", ""),
            order_index=current_max_order + item.get("order_index", 1)
        )
        session.add(concept)
        new_concepts.append(concept)
    
    session.commit()
    for c in new_concepts:
        session.refresh(c)
        
    return new_concepts

# --- ACTIVITIES ---

@router.get("/activities/", response_model=List[Activity])
def read_activities(concept_id: uuid.UUID, session: Session = Depends(get_session)):
    """
    List activities for a specific concept.
    """
    statement = select(Activity).where(Activity.concept_id == concept_id)
    results = session.exec(statement).all()
    return results

@router.post("/activities/generate", response_model=List[Activity])
async def generate_activities(
    concept_id: uuid.UUID = Body(..., embed=True),
    model_name: str = Body(None, embed=True),
    session: Session = Depends(get_session)
):
    """
    Generates activities for a concept using AI.
    """
    concept = session.get(Concept, concept_id)
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    # Get Topic context too for better generation
    topic = session.get(Topic, concept.topic_id)
    context = f"Topic: {topic.title}\nConcept: {concept.title}\nConcept Description: {concept.description}"

    try:
        activities_data = await llm_service.generate_activities(
            concept_title=concept.title,
            context=context,
            model_name=model_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Generation failed: {str(e)}")

    new_activities = []
    for item in activities_data:
        # Handle content being dict or string
        content_val = item.get("content")
        if isinstance(content_val, dict):
            content_val = json.dumps(content_val)
        
        activity = Activity(
            concept_id=concept.id,
            type=item["type"],
            instructions=item["instructions"],
            content=content_val,
            status=ActivityStatus.PENDING
        )
        session.add(activity)
        new_activities.append(activity)

    session.commit()
    for a in new_activities:
        session.refresh(a)
        
    return new_activities

@router.patch("/activities/{activity_id}/complete", response_model=Activity)
def complete_activity(
    activity_id: uuid.UUID,
    user_score: int = Body(..., embed=True),
    session: Session = Depends(get_session)
):
    """
    Mark an activity as completed with a self-assessment score (1-5).
    """
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    if user_score < 1 or user_score > 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

    activity.status = ActivityStatus.COMPLETED
    activity.user_score = user_score
    session.add(activity)
    session.commit()
    session.refresh(activity)
    return activity
