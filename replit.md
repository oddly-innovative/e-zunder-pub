# eZunder - AI-Powered ePublishing Platform

## Overview

eZunder is a modern full-stack web application that combines AI-powered content generation with a comprehensive document management system. The application leverages Google's Gemini AI through the @google/genai library to provide intelligent content creation, improvement, translation, and summarization capabilities.

The system follows a monolithic architecture with a clear separation between frontend (React + ShadCN/UI) and backend (Express.js + Drizzle ORM), all contained within a single repository for simplified development and deployment.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Styling**: Tailwind CSS with ShadCN/UI component library
- **State Management**: TanStack React Query for server state and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Authentication**: JWT-based with HTTP-only cookies

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt for password hashing
- **AI Integration**: Google Gemini AI via @google/genai library
- **Database Provider**: Neon serverless PostgreSQL

### Database Design
The application uses a relational database with the following core entities:
- **Users**: Authentication and user management
- **Projects**: Top-level organization for documents
- **Documents**: Individual content pieces with AI-generated content
- **AI Logs**: Tracking AI usage and token consumption

## Key Components

### Authentication System
- JWT-based authentication with access tokens
- Password hashing using bcryptjs
- Protected routes with middleware verification
- Session management through HTTP-only cookies

### AI Content Engine
- **Content Generation**: Create articles, books, reports, and other content types
- **Content Improvement**: Grammar, style, clarity, and engagement enhancements
- **Translation**: Multi-language content translation
- **Summarization**: Intelligent content summarization
- **Token Tracking**: Monitor AI usage and costs

### Document Management
- Rich text editor with formatting capabilities
- Project-based organization
- Version control and status tracking
- Word count and metadata management

### User Interface
- Responsive design with mobile-first approach
- Dark/light mode support via CSS custom properties
- Component-based architecture with reusable UI elements
- Real-time updates using React Query

## Data Flow

1. **Authentication Flow**: User login → JWT generation → Token storage → Protected route access
2. **Content Creation Flow**: User input → AI prompt generation → Gemini API call → Content processing → Database storage
3. **Document Management Flow**: Document creation → Content editing → Auto-save → Status updates
4. **AI Assistance Flow**: Content selection → AI service selection → Processing → Result integration

## External Dependencies

### Core Technologies
- **@google/genai**: Google Gemini AI integration
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **zod**: Runtime type validation
- **@radix-ui**: Accessible UI primitives

### Development Tools
- **TypeScript**: Static type checking
- **Vite**: Fast development server and build tool
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler

## Deployment Strategy

### Development Environment
- Local development with hot reloading via Vite
- Database migrations using Drizzle Kit
- Environment variables for configuration

### Production Build
- Frontend: Static build optimized for production
- Backend: ESBuild compilation to ES modules
- Database: Neon serverless PostgreSQL for scalability

### Environment Configuration
- `DATABASE_URL`: Neon PostgreSQL connection string
- `GEMINI_API_KEY`: Google AI API credentials
- `JWT_SECRET`: Token signing secret

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 28, 2025: Initial setup completed
- June 28, 2025: Fixed React Query import errors and authentication flow
- June 28, 2025: Completed comprehensive testing and user journey validation
- June 28, 2025: Application now fully functional with all modules working correctly
- June 28, 2025: Implemented mobile-responsive design with collapsible format menu
- June 28, 2025: Added Google Fonts integration for KDP-ready document formatting
- June 28, 2025: Created project-specific style management with publishing utilities

## Changelog

- June 28, 2025: Initial setup
- June 28, 2025: Resolved routing issues and authentication token handling
- June 28, 2025: Fixed API response structure mismatches
- June 28, 2025: Successfully completed thorough customer experience testing