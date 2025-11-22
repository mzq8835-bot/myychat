# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 chat application (myychat) that provides a ChatGPT-like interface for AI conversations. It connects to a backend API server for chat functionality, session management, and AI model interaction.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (Vite, runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Note: The README.md references `npm run serve` and `npm run lint`, but these scripts don't exist in package.json. Use `npm run dev` instead.

## Architecture

### Tech Stack
- **Frontend Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite 4
- **Styling**: Scoped CSS (no CSS framework)
- **Markdown Rendering**: markdown-it
- **Development Server**: Runs on port 3000

### Core Components Structure

1. **App.vue** - Main application container
   - Manages global state (conversations, models, loading states)
   - Handles API communication with backend
   - Orchestrates child components (Sidebar, ChatMessage, Composer)
   - Implements SSE streaming for AI responses

2. **SidebarConversations.vue** - Left sidebar navigation
   - Displays conversation list grouped by date
   - Supports infinite scroll pagination
   - Handles conversation editing and deletion
   - Placeholder for "智能体" (Agents) feature

3. **ChatMessage.vue** - Individual message display
   - Renders both user and AI messages
   - Markdown rendering with syntax highlighting
   - Supports image attachments
   - Collapsible "thinking process" section (for AI reasoning)
   - Copy message functionality

4. **Composer.vue** - Message input area
   - Text input with multi-line support
   - Model selection dropdown
   - Checkboxes for "联网搜索" (internet search) and "深度思考" (deep thinking)
   - Image paste/upload support (Ctrl+V for screenshots)
   - Send button with loading state

### Backend API Integration

**Base URL**: `http://127.0.0.1:15001/api`

Key endpoints:
- `GET /userConfig/aiModelOptions` - Fetch available AI models
- `GET /chatSession/history?pageNum={n}&pageSize={m}` - Load conversation sessions
- `GET /chatMessage/page?sessionId={id}&pageNum={n}&pageSize={m}` - Load messages for a session
- `POST /chatMessage/submit` - Send message and receive SSE stream response
- `POST /chatSession/edit` - Edit session name
- `POST /chatSession/delete?sessionId={id}` - Delete a session

### State Management Patterns

The app uses Vue 3 Composition API with reactive refs:
- **conversations**: Array of conversation objects with messages
- **currentConversationId**: Currently selected conversation
- **modelOptions**: Available AI models from API
- **isLoading/isTyping**: UI loading states
- **currentAbortController**: For canceling streaming requests

### Message Format

Messages in the app follow this structure:
```javascript
{
  id: number,           // Unique identifier
  content: string,      // Message text (markdown supported)
  isUser: boolean,      // true for user, false for AI
  timestamp: Date,      // Message timestamp
  isStreaming: boolean, // true while AI is responding
  images: Array,        // Attached images with dataUrl
  avatarUrl: string,    // Avatar image URL
  modelName: string,    // AI model used (e.g., "gpt-4o")
  thinking: string,     // AI thinking process (markdown)
  thinkingTime: string  // Time spent thinking
}
```

### Streaming Response Pattern

The app uses Server-Sent Events (SSE) for real-time AI responses:
1. Creates AbortController for cancellation
2. Sends POST to `/chatMessage/submit`
3. Reads response stream line by line
4. Parses JSON events (`chat_message`, `stream_end`)
5. Incrementally updates message content
6. Handles errors and abort signals

## Docker Deployment

The project includes a multi-stage Dockerfile:
- Build stage: Uses Node 18 Alpine to build with Vite
- Production stage: Uses Nginx Alpine to serve static files
- Custom nginx.conf can be used for routing configuration
- Exposes port 80

Build and run:
```bash
docker build -t myychat .
docker run -p 80:80 myychat
```

## Code Conventions

- Vue 3 Composition API (setup function, not `<script setup>`)
- Scoped CSS with BEM-like naming
- Markdown rendering for all message content
- Responsive design with mobile breakpoints at 768px and 1000px
- All user-facing text in Chinese
- API responses handle multiple possible data structures for flexibility

## Key Implementation Details

### Infinite Scroll
SidebarConversations implements scroll detection in `handleScroll()` - loads more when within 50px of bottom.

### Image Support
Composer supports:
- File upload via input
- Paste from clipboard (Ctrl+V)
- Preview with removal
- Images sent as base64 dataUrl in request

### Error Handling
API errors are displayed in chat as AI messages. The app checks for `code !== '00000'` in streaming responses.

### Session Management
Sessions are loaded with pagination (default 20 per page) and support:
- Create (TODO - not yet implemented in App.vue:287-289)
- Read (with messages)
- Update (edit name)
- Delete (with confirmation)
