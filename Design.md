# Autodidact - Technical Design Document

## 1. Architecture Overview
The system follows a standard single-user web application pattern:
*   **Frontend:** React (SPA) for a responsive, interactive UI.
*   **Backend:** Python (FastAPI) for REST API endpoints and business logic.
*   **Database:** SQLite for relational data and vector embeddings (via extension or separate table).
*   **AI Provider:** Google Gemini API.

## 2. Tech Stack Choices
*   **Language:** Python 3.10+
*   **Framework:** FastAPI (High performance, easy async for AI calls).
*   **Database:** SQLite (Embedded, zero-config, perfect for single-user).
    *   *ORM:* SQLAlchemy or SQLModel.
*   **Frontend:** React (Vite build tool).
    *   *Styling:* Tailwind CSS.
    *   *State:* React Query (TanStack Query) for server state management.
*   **AI/LLM:** `google-generativeai` SDK.

## 3. Data Model (SQLite Schema)

The schema supports the "Hybrid Linear + Graph" requirement.

### 3.1 Entities

#### `Topic`
Represents a subject or concept.
*   `id`: UUID
*   `title`: String
*   `description`: Text
*   `parent_id`: UUID (Self-referential FK for Tree structure)
*   `order_index`: Integer (For linear syllabus ordering)
*   `created_at`: Datetime

#### `Resource`
External materials (PDFs, URLs).
*   `id`: UUID
*   `topic_id`: UUID (FK)
*   `type`: Enum (PDF, URL, TEXT)
*   `path_or_url`: String
*   `content_summary`: Text (AI Generated)
*   `raw_content`: Text (Extracted text for searching)

#### `Note`
User-generated thoughts or Zettelkasten entries.
*   `id`: UUID
*   `topic_id`: UUID (FK, Optional)
*   `resource_id`: UUID (FK, Optional)
*   `content`: Text (Markdown)

#### `Link` (The Graph Glue)
Represents connections between any two entities (Topic-Topic, Note-Note, Topic-Note).
*   `source_id`: UUID
*   `target_id`: UUID
*   `type`: Enum (RELATED, PREREQUISITE, MENTIONED)

## 4. Key Component Design

### 4.1 Content Ingestion Pipeline
1.  **PDFs:** Use `pypdf` or `pdfminer.six` to extract text. Store text in `Resource.raw_content`.
2.  **URLs:** Use `beautifulsoup4` and `requests` to fetch and clean HTML text.
3.  **Processing:** Send `raw_content` to Gemini Flash for a specific "Learning Summary" prompt.

### 4.2 The "Curriculum Engine"
*   **Input:** User string (e.g., "Rust Programming").
*   **Prompt:** Structured prompt to Gemini asking for a JSON output of a nested syllabus.
*   **Action:** Parse JSON -> Recursive insert into `Topic` table.

### 4.3 Search & RAG (Retrieval Augmented Generation)
*   *MVP:* Keyword search using SQLite FTS5 (Full Text Search) on `Resource.raw_content` and `Note.content`.
*   *Phase 2:* Vector embeddings (ChromaDB or SQLite-vss) for semantic search.

## 5. Directory Structure
```
autodidact/
├── backend/
│   ├── main.py          # Entry point
│   ├── database.py      # SQLite connection
│   ├── models.py        # SQLModel definitions
│   ├── services/
│   │   ├── llm.py       # Gemini integration
│   │   ├── ingest.py    # PDF/URL parsing
│   ├── routers/
│   └── uploads/         # Local storage for PDFs
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api.py
├── Design.md
└── PRD.md
```

## 6. API Endpoints (Draft)
*   `POST /topics/generate` - Generate syllabus from prompt.
*   `GET /topics/tree` - Get hierarchical view.
*   `POST /resources/upload` - Upload PDF/URL.
*   `POST /chat` - Chat with context (current topic + linked resources).
