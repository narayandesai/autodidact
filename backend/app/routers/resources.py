from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from app.database import get_session
from app.models import Resource, ResourceType, Topic
from app.services.llm import LLMService
from app.services import ingest
import uuid
from typing import List

router = APIRouter(prefix="/resources", tags=["resources"])
llm_service = LLMService()

@router.post("/upload/pdf", response_model=Resource)
async def upload_pdf(
    topic_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    model_name: str | None = Form(None),
    session: Session = Depends(get_session)
):
    # Verify topic exists
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    content = await file.read()
    try:
        text = ingest.extract_text_from_pdf(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

    summary = await llm_service.summarize_text(text, model_name=model_name)

    resource = Resource(
        topic_id=topic_id,
        type=ResourceType.PDF,
        path_or_url=file.filename, # In real app, save file and store path
        raw_content=text,
        content_summary=summary
    )
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource

@router.post("/add/url", response_model=Resource)
async def add_url(
    topic_id: uuid.UUID,
    url: str,
    model_name: str | None = None,
    session: Session = Depends(get_session)
):
    # Verify topic exists
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    try:
        text = ingest.extract_text_from_url(url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")

    summary = await llm_service.summarize_text(text, model_name=model_name)

    resource = Resource(
        topic_id=topic_id,
        type=ResourceType.URL,
        path_or_url=url,
        raw_content=text,
        content_summary=summary
    )
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource

@router.get("/topic/{topic_id}", response_model=List[Resource])
def get_resources_by_topic(topic_id: uuid.UUID, session: Session = Depends(get_session)):
    resources = session.exec(select(Resource).where(Resource.topic_id == topic_id)).all()
    return resources
