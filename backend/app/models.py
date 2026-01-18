from typing import Optional, List
from datetime import datetime
import uuid
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum

class ResourceType(str, Enum):
    PDF = "pdf"
    URL = "url"
    TEXT = "text"

class TopicStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"

class LinkType(str, Enum):
    RELATED = "related"
    PREREQUISITE = "prerequisite"
    MENTIONED = "mentioned"

class Link(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    source_id: uuid.UUID
    target_id: uuid.UUID
    type: LinkType

class TopicBase(SQLModel):
    title: str
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = Field(default=None) # Points to another Topic.id
    order_index: int = 0
    status: TopicStatus = Field(default=TopicStatus.PENDING)

class Topic(TopicBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships could be added here if needed, but keeping it simple for now
    # resources: List["Resource"] = Relationship(back_populates="topic")

class ResourceBase(SQLModel):
    type: ResourceType
    path_or_url: str
    content_summary: Optional[str] = None

class Resource(ResourceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    topic_id: uuid.UUID = Field(foreign_key="topic.id")
    raw_content: Optional[str] = None # For full text search
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NoteBase(SQLModel):
    content: str

class Note(NoteBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    topic_id: Optional[uuid.UUID] = Field(default=None, foreign_key="topic.id")
    resource_id: Optional[uuid.UUID] = Field(default=None, foreign_key="resource.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
