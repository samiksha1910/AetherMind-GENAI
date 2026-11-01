
# AetherMind — System Architecture

## 1. Project Overview

AetherMind is a Personal AI Chief of Staff that transforms natural-language text and voice notes into structured tasks, priorities, deadlines, and goal milestones.

**Tagline:** Think Naturally. Organize Intelligently.

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | Python + FastAPI |
| AI Model | Google Gemini API |
| Data Validation | Pydantic |
| Database | MongoDB Atlas |
| Voice Input | Browser Speech Recognition API |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

## 3. System Architecture

The application follows a frontend-backend-database architecture.

1. User enters a text note or speaks using the microphone.
2. Voice input is converted into editable text in the browser.
3. Frontend sends the text to the FastAPI backend.
4. Backend sends the input to Gemini using a schema-guided prompt.
5. Gemini returns structured task information.
6. Pydantic validates the generated data.
7. Frontend displays the extracted tasks for user review.
8. User confirms which tasks should be saved.
9. Backend stores confirmed tasks in MongoDB Atlas.
10. Frontend displays the saved tasks and confirmation.

## 4. Core Features

### AI Task Extraction
Convert unstructured text or voice notes into structured tasks.

### Task Management
Create, view, update, complete, and delete tasks.

### Priority Detection
Classify tasks as Low, Medium, or High priority.

### Deadline Extraction
Identify deadlines from natural-language input. Missing deadlines must remain null rather than being invented.

### Goal Breakdown
Convert broad goals into smaller milestones and actionable tasks.

### Dashboard
Display task summaries, upcoming deadlines, priorities, and progress.

## 5. Initial Database Design

### Tasks Collection

- title: string
- description: string
- category: string
- priority: Low / Medium / High
- due_date: date or null
- status: Pending / In Progress / Completed
- source: Text / Voice
- created_at: datetime

### Goals Collection

- title: string
- description: string
- milestones: array
- status: Active / Completed
- created_at: datetime

## 6. Backend Responsibilities

- Receive frontend requests.
- Communicate securely with Gemini.
- Generate schema-guided structured output.
- Validate output using Pydantic.
- Handle missing fields and invalid responses.
- Create and update MongoDB records.
- Return meaningful success and error responses.

## 7. Frontend Pages

- Dashboard
- AI Assistant
- My Tasks
- Goals & Milestones
- Calendar
- Settings

## 8. API Design

- POST /api/ai/extract
- POST /api/tasks
- GET /api/tasks
- PATCH /api/tasks/{id}
- DELETE /api/tasks/{id}
- POST /api/goals/breakdown
- GET /api/goals
- POST /api/goals

## 9. Security

- Store API keys in backend environment variables.
- Never expose Gemini or database credentials in frontend code.
- Keep environment files out of Git.
- Validate incoming data before database operations.
- Require user confirmation before saving AI-generated tasks.

## 10. Error Handling

The application must handle:

- Empty user input.
- Missing task information.
- Invalid AI-generated output.
- AI API failures.
- Database connection failures.
- Invalid task IDs.
- Frontend-backend communication errors.

## 11. Deployment

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

The deployed frontend must communicate with the deployed backend and database.

## 12. Development Rules

- Keep the agreed architecture and design consistent.
- Do not introduce unnecessary features.
- Test each major development phase.
- Keep API keys private.
- Preserve working functionality when updating code.
