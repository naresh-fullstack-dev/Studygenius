# Overview

EduAI is a comprehensive educational platform that combines PDF document management with AI-powered learning tools. The application allows users to upload PDF documents and leverage AI to generate study questions, interactive chat sessions for tutoring, and structured study notes. Built as a full-stack web application, it provides an integrated learning experience by extracting content from PDFs and using OpenAI's GPT-4o model to create personalized educational content.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using React with TypeScript, utilizing Vite as the build tool and development server. The application follows a component-based architecture with:

- **UI Framework**: Shadcn/ui components built on top of Radix UI primitives for accessibility and customization
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **Routing**: Wouter for client-side routing with four main pages (Upload, Generate, Chat, Notes)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation schemas

The frontend uses a clean separation of concerns with dedicated directories for components, pages, hooks, and utilities. The design system is consistent across the application with reusable UI components.

## Backend Architecture

The backend is an Express.js server with TypeScript, following a modular architecture:

- **API Layer**: RESTful endpoints for PDF management, question generation, chat interactions, and notes creation
- **Service Layer**: Dedicated AI service for OpenAI integration and storage abstraction layer
- **File Handling**: Multer middleware for PDF upload processing with file validation and size limits
- **Error Handling**: Centralized error handling with proper HTTP status codes and error messages

The server implements a clean separation between routes, business logic, and data access, making it easy to maintain and extend.

## Data Storage Solutions

The application uses a flexible storage architecture with an interface-based approach:

- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Relational model with tables for PDFs, questions, chat messages, and study notes
- **Development Storage**: In-memory storage implementation for development and testing
- **File Storage**: Local file system for PDF documents with organized upload directory structure

The storage layer is abstracted through interfaces, allowing for easy switching between different storage implementations.

## AI Integration

The application integrates with Puter.js for free AI capabilities without requiring API keys:

- **Question Generation**: Creates various types of questions (MCQ, short answer, true/false, fill-in-the-blank) based on PDF content using Puter.js frontend AI
- **Chat Tutoring**: Provides interactive tutoring sessions with context-aware responses powered by Puter.js
- **Study Notes**: Generates structured notes in different styles (summary, detailed, outline) using frontend AI processing
- **Content Processing**: Extracts and processes text content from uploaded PDFs using pdf-parse library
- **Frontend AI Processing**: All AI operations happen on the frontend using Puter.js, eliminating the need for server-side AI processing and API keys

The AI service uses Puter.js's "User Pays" model, allowing free access to GPT-4o, GPT-4.1, and other advanced models directly from the browser.

## Authentication and Session Management

The application includes session management infrastructure:

- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple
- **Security**: Secure session configuration with appropriate cookie settings
- **Development Support**: Session handling optimized for both development and production environments

# External Dependencies

## Core Framework Dependencies

- **React 18**: Frontend framework with modern hooks and concurrent features
- **Express.js**: Backend web framework for Node.js
- **TypeScript**: Type safety across both frontend and backend
- **Vite**: Build tool and development server with hot module replacement

## UI and Styling

- **Shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Headless UI components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Database and ORM

- **Drizzle ORM**: Type-safe SQL database toolkit
- **Neon Database**: Serverless PostgreSQL database service
- **Drizzle Kit**: Database migration and schema management tools

## AI and Content Processing

- **OpenAI API**: GPT-4o model for content generation and chat functionality
- **React PDF**: PDF viewing and processing capabilities
- **PDF.js**: PDF rendering in the browser

## Development and Build Tools

- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing and optimization
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for type-safe data handling

## File Upload and Processing

- **Multer**: Middleware for handling multipart/form-data and file uploads
- **React Dropzone**: Drag-and-drop file upload interface

## State Management and HTTP

- **TanStack Query**: Server state management and data fetching
- **Wouter**: Lightweight client-side routing solution

## Development Environment

- **Replit Integration**: Custom plugins for Replit development environment
- **Runtime Error Overlay**: Development error handling and debugging