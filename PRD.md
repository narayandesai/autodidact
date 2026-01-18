# Autodidact - Product Requirements Document (PRD)

## 1. Overview
**Autodidact** is a single-user web application designed to transform curiosity into structured knowledge. It acts as an AI-powered research assistant and learning companion, allowing users to define topics of interest, aggregate resources (PDFs, URLs, AI summaries), and build a connected knowledge base.

## 2. Core Philosophy
*   **Active over Passive:** Moving from reading to connecting and summarizing.
*   **Hybrid Structure:** Knowledge is both a path (Curriculum) and a network (Graph).
*   **AI as Accelerator:** Uses Gemini to synthesize vast amounts of data into digestible insights.

## 3. User Personas & Journeys

### 3.1 The Architect (Planning)
*   **Goal:** Define a learning roadmap for a vague or specific topic (e.g., "Neuroscience").
*   **Journey:**
    1.  User enters a topic query.
    2.  System (Gemini) generates a hierarchical breakdown of sub-topics.
    3.  User selects/deselects sub-topics to finalize a "Syllabus".
    4.  System creates Topic nodes in the database.

### 3.2 The Researcher (Gathering & Ingestion)
*   **Goal:** Populate topics with high-quality information.
*   **Journey:**
    1.  User uploads PDFs or pastes URLs relevant to a Topic.
    2.  System extracts text and metadata.
    3.  System (Gemini) generates a "Key Concepts" summary for the resource.
    4.  User can ask specific questions against the resource (RAG - Retrieval Augmented Generation).

### 3.3 The Synthesizer (Connecting & Learning)
*   **Goal:** Internalize information by linking concepts.
*   **Journey:**
    1.  User writes notes (Markdown) attached to Topics or Resources.
    2.  User links Note A to Note B (bidirectional linking).
    3.  System suggests connections between current notes and related topics in the Syllabus.
    4.  User asks "Out of order" questions (e.g., "How does this concept relate to what I learned in Module 1?").

## 4. Functional Capabilities

### 4.1 Topic Management (The Knowledge Graph)
*   **Hierarchical View:** Tree view for the structured Syllabus.
*   **Graph View:** Network view showing relationships between Topics.
*   **CRUD:** Create, Read, Update, Delete topics manually or via AI generation.

### 4.2 Resource Management
*   **Ingestion:** Support for PDF upload and URL scraping.
*   **Storage:** Local file storage for PDFs; SQLite for metadata/text content.
*   **AI Processing:** Automatic summarization upon ingestion.

### 4.3 Note-Taking & Linking
*   **Editor:** Rich text/Markdown editor.
*   **Linking:** `[[WikiLink]]` style support to connect Notes/Topics.
*   **Context:** Side-by-side view of Resource (PDF/Web) and Note editor.

### 4.4 AI Research Assistant (Gemini)
*   **Curriculum Gen:** Generating topic trees.
*   **Summarizer:** Compressing long-form content.
*   **Tutor Chat:** Context-aware chat that knows the current Topic and Syllabus.

## 5. Future Scope (Post-MVP)
*   **Spaced Repetition (Anki-style):** Auto-generating flashcards from Notes.
*   **Deep Web Research:** Agentic browsing to find resources automatically.
*   **Multi-modal:** Video summarization (YouTube).
