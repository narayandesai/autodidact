export interface Topic {
    id: string;
    title: string;
    description?: string;
    parent_id?: string;
    order_index: number;
    children?: Topic[]; // Helper for UI
    status: "pending" | "completed";
}

export interface Resource {
    id: string;
    topic_id: string;
    type: "pdf" | "url" | "text";
    path_or_url: string;
    content_summary?: string;
    raw_content?: string;
    created_at: string;
}

export interface LLMModel {
    name: string;
    display_name: string;
}

const API_BASE = "http://localhost:8000";

export async function getModels(): Promise<LLMModel[]> {
    const response = await fetch(`${API_BASE}/topics/models`);
    if (!response.ok) {
        throw new Error("Failed to fetch models");
    }
    return response.json();
}

export async function updateTopicStatus(topicId: string, status: "pending" | "completed"): Promise<Topic> {
    const response = await fetch(`${API_BASE}/topics/${topicId}/status?status=${status}`, {
        method: "PATCH",
    });
    if (!response.ok) {
        throw new Error("Failed to update topic status");
    }
    return response.json();
}

export async function elaborateTopic(topicId: string, instruction: string, modelName?: string): Promise<Topic> {
    const response = await fetch(`${API_BASE}/topics/${topicId}/elaborate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, model_name: modelName })
    });
    if (!response.ok) {
        throw new Error("Failed to elaborate topic");
    }
    return response.json();
}

export async function askTopic(topicId: string, question: string, modelName?: string): Promise<{ answer: string }> {
    const response = await fetch(`${API_BASE}/topics/${topicId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, model_name: modelName })
    });
    if (!response.ok) {
        throw new Error("Failed to ask question");
    }
    return response.json();
}

export async function generateSyllabus(prompt: string, modelName?: string): Promise<Topic> {
    let url = `${API_BASE}/topics/generate?prompt=${encodeURIComponent(prompt)}`;
    if (modelName) {
        url += `&model_name=${encodeURIComponent(modelName)}`;
    }
    const response = await fetch(url, {
        method: "POST",
    });
    if (!response.ok) {
        throw new Error("Failed to generate syllabus");
    }
    return response.json();
}

export async function getTopics(): Promise<Topic[]> {
    const response = await fetch(`${API_BASE}/topics/`);
    if (!response.ok) {
        throw new Error("Failed to fetch topics");
    }
    return response.json();
}

export async function getResources(topicId: string): Promise<Resource[]> {
    const response = await fetch(`${API_BASE}/resources/topic/${topicId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch resources");
    }
    return response.json();
}

export async function addUrlResource(topicId: string, url: string, modelName?: string): Promise<Resource> {
    let fetchUrl = `${API_BASE}/resources/add/url?topic_id=${topicId}&url=${encodeURIComponent(url)}`;
    if (modelName) {
        fetchUrl += `&model_name=${encodeURIComponent(modelName)}`;
    }
    const response = await fetch(fetchUrl, {
        method: "POST",
    });
    if (!response.ok) {
        throw new Error("Failed to add URL resource");
    }
    return response.json();
}

export async function uploadPdfResource(topicId: string, file: File, modelName?: string): Promise<Resource> {
    const formData = new FormData();
    formData.append("topic_id", topicId);
    formData.append("file", file);
    if (modelName) {
        formData.append("model_name", modelName);
    }

    const response = await fetch(`${API_BASE}/resources/upload/pdf`, {
        method: "POST",
        body: formData,
    });
    if (!response.ok) {
        throw new Error("Failed to upload PDF");
    }
    return response.json();
}

// --- Pedagogy ---

export interface Concept {
    id: string;
    topic_id: string;
    title: string;
    description: string;
    order_index: number;
}

export interface Activity {
    id: string;
    concept_id: string;
    type: "read" | "watch" | "quiz" | "code" | "write";
    instructions: string;
    content: any;
    status: "pending" | "completed";
    user_score?: number;
}

export async function getConcepts(topicId: string): Promise<Concept[]> {
    const response = await fetch(`${API_BASE}/pedagogy/concepts/?topic_id=${topicId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch concepts");
    }
    return response.json();
}

export async function generateConcepts(topicId: string, modelName?: string): Promise<Concept[]> {
    const response = await fetch(`${API_BASE}/pedagogy/concepts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId, model_name: modelName })
    });
    if (!response.ok) {
        throw new Error("Failed to generate concepts");
    }
    return response.json();
}

export async function getActivities(conceptId: string): Promise<Activity[]> {
    const response = await fetch(`${API_BASE}/pedagogy/activities/?concept_id=${conceptId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch activities");
    }
    return response.json();
}

export async function generateActivities(conceptId: string, modelName?: string): Promise<Activity[]> {
    const response = await fetch(`${API_BASE}/pedagogy/activities/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept_id: conceptId, model_name: modelName })
    });
    if (!response.ok) {
        throw new Error("Failed to generate activities");
    }
    return response.json();
}

export async function completeActivity(activityId: string, score: number): Promise<Activity> {
    const response = await fetch(`${API_BASE}/pedagogy/activities/${activityId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_score: score })
    });
    if (!response.ok) {
        throw new Error("Failed to complete activity");
    }
    return response.json();
}
