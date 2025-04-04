# Project Design Document: Loom-Based Web Automation Agent

**Version:** 2.0
**Date:** April 4, 2025
**Author:** Gemini AI

## 1. Introduction

This document provides a comprehensive design for a web application that enables users to automate web-based tasks by analyzing Loom videos. The system will enable users to record repetitive online actions, have the AI understand and replicate those actions, learn from user feedback, and eventually automate these tasks efficiently through browser automation, direct API integrations, and workflow platforms like Make.com and Zapier. The core goal is to create reusable "agents" that streamline workflows and minimize manual effort.

## 2. Goals

* Enable users to automate web tasks by providing a Loom video URL.
* Create reusable "agents" for specific automation workflows.
* Facilitate a learning process where the AI improves its automation capabilities through user feedback and manual interventions.
* Integrate with external platforms (Make.com, Zapier) to leverage existing automation modules and simplify complex integrations.
* Utilize direct API calls where feasible for more efficient automation.
* Provide a user-friendly web interface for managing and running automation agents.
* Store and version control agents using GitHub.
* Employ modern and preferably free technologies for development.

## 3. Target User

Individuals and teams who perform repetitive tasks online, including:

* E-commerce businesses managing orders and inventory (Shopify, ShipStation).
* Marketing teams gathering leads and managing social media (Meta).
* Researchers collecting data from various websites (Google Maps).
* Anyone looking to automate routine web interactions and save time.

## 4. High-Level Overview

The application takes a Loom video URL as input. The AI analyzes the video (including transcript and visual elements) to understand the sequence of actions. The user reviews and refines these actions, breaking them into manageable chunks. The system automates these chunks using browser automation (Playwright), learning from user feedback and interventions. Successful automation sequences are saved as reusable "agents" and managed through a web dashboard and GitHub. The system intelligently suggests and uses Make.com/Zapier integrations where applicable.

## 5. Detailed Functionality

### 5.1. Loom Video Analysis Module Details

This module is responsible for taking a user-provided Loom video URL and extracting the necessary information to understand the online tasks being performed.

* **Transcript Acquisition and Processing:**
    * The backend (Node.js) interacts with the Loom API to retrieve the transcript.
    * The system handles cases where a transcript is unavailable.
    * NLP techniques are used for keyword extraction, intent recognition, and entity recognition.
* **URL Extraction via OCR:**
    * OCR (Tesseract.js or a cloud service) extracts URLs from video frames, tracking navigation.
* **Visual Analysis Techniques:**
    * Initial methods detect mouse clicks and page transitions.
    * Advanced OCR identifies UI elements (buttons, text, labels).
    * Future: Computer vision models for object and action recognition.
* **Chunking Logic:**
    * Automatic chunk segmentation based on pauses, URL changes, and task completion.
    * User interface tools for manual chunk adjustment.
    * Chunk data includes timestamps and descriptions.

### 5.2. User Interface (UI) and User Experience (UX) Specification

The UI is designed to be simple, intuitive, and efficient, guiding users through the automation process.

* **Homepage:**
    * Loom Video URL input field and "Analyze Loom" button.
    * Link to Login/Signup.
* **Login/Signup:**
    * Email/password and social login (Google) options (via Supabase).
* **Chunk Management Screen:**
    * Agent title/Loom URL display.
    * Chunk list with timestamps and status indicators.
    * Main Loom video player and micro-video previews.
    * Chunk details panel with controls (Run, Re-run, Skip, Edit).
    * Global controls (Run All, Save Agent, Export to GitHub).
* **Feedback and Intervention UI:**
    * AI attempt log with screenshots.
    * "Try Again" button for AI self-correction.
    * "Take Control and Record" button for manual takeover.
    * Recording indicator.
    * "Resume Automation" button.
    * Optional feedback input.
* **Agent Dashboard:**
    * List of saved agents with names, descriptions, and status.
    * Actions: Run, Edit Chunks, View Details, Export to GitHub, Delete.

### 5.3. Automation Engine Design

This component translates analyzed information into automated actions.

* **Playwright Integration:**
    * Browser initialization and control (headed/headless).
    * Mapping analyzed actions to Playwright commands (e.g., `page.goto()`, `page.click()`, `page.fill()`).
    * UI element location strategies (text-based, CSS, XPath, visual context).
    * Handling user input and dynamic content.
* **Error Handling within Automation:**
    * `Try-catch` blocks for Playwright actions.
    * Detailed error logging (timestamp, action, command, error message, URL, screenshot).
    * Pausing and resuming automation.
* **AI-Driven Integration Suggestions:**
    * Identifying opportunities to use Make.com/Zapier based on Loom analysis and user goals.
    * Suggesting specific Make.com/Zapier modules.
    * Implementing the integration (initially, user-guided).
* **Learning and Adaptation:**
    * Recording user interventions (mouse/keyboard actions, page changes).
    * Analyzing correction patterns (selector errors, missing steps).
    * Applying learned corrections to future automation.
    * Potential future ML integration for advanced pattern recognition.

### 5.4. Integration with External Platforms

This section details the integration with Make.com, Zapier, and GitHub.

* **Make.com and Zapier Integration:**
    * OAuth 2.0 authentication.
    * UI for connection.
    * AI identifies integration opportunities (data transfer, trigger-action sequences).
    * AI suggests Make.com/Zapier modules and scenarios/zaps.
    * Triggering scenarios/zaps from our application (API calls, data mapping).
    * Asynchronous execution handling.
    * Error handling.
* **GitHub Integration:**
    * OAuth 2.0 authentication with GitHub.
    * Repository selection/creation UI.
    * Agent configuration export (JSON/YAML).
    * File committing and pushing to GitHub.
    * Future: Branch management.

### 5.5. Agent Management System

This system handles saving, loading, and managing automated workflows.

* **Agent Data Structure:**
    * `Agents` and `Chunks` tables in Supabase.
    * Agent data includes name, description, Loom URL, GitHub link.
    * Chunk data includes order, timestamps, status, learned actions, error details.
* **Saving Agents:**
    * User provides agent name (and optional description).
    * Agent and chunk data are stored in Supabase.
    * Agent configuration is serialized.
* **Loading Agents:**
    * Agents are retrieved from Supabase.
    * Agent configuration is deserialized.
* **Agent Dashboard Functionality:**
    * List of agents with status.
    * Agent details and chunk editing.
    * Agent execution controls.
    * Agent management actions (export, delete).
* **Agent Execution Logic:**
    * Iterating through chunks and executing actions (Playwright or Make.com/Zapier).
    * Execution modes (automatic, verification, debugging).
* **Agent Versioning (Future):**
    * Potentially using Git or database-based versioning.

### 5.6. Data Storage and Management

Supabase is used for data storage and user management.

* **Supabase Setup:**
    * Supabase project creation and configuration.
    * Authentication and authorization setup.
* **Detailed Database Schema:**
    * `Users` table: user account information.
    * `Agents` table: agent metadata.
    * `Chunks` table: chunk details and learned actions.
    * Future: potential tables for logging, API keys, user settings.
* **API Interactions with Supabase:**
    * Node.js backend interacts with Supabase API.
    * Operations: user authentication, data retrieval, creation, update, deletion.
    * Potential use of Supabase's realtime functionality.
* **Data Security and Privacy:**
    * Supabase authentication and RLS.
    * Encryption of sensitive data (API keys).
    * HTTPS for data in transit.
    * Input validation and sanitization.
    * Regular security audits.
    * Compliance with data privacy regulations.
* **Data Migration and Updates:**
    * Strategy for managing database schema changes.

### 5.7. Error Handling and Recovery Strategy

Robust error handling is implemented across the application.

* **Error Categories:**
    * Loom Analysis Errors.
    * Automation Errors (Playwright).
    * Integration Errors (Make.com/Zapier, GitHub).
    * Application Errors (backend, database).
* **Error Handling Details:**
    * Specific error handling for each category (e.g., retries, user prompts, logging).
    * Detailed logging of error information (timestamp, action, error message, URL, screenshot).
    * User feedback and error reporting mechanisms.
* **Recovery Mechanisms:**
    * Automatic retries for transient errors.
    * User intervention via "Take Control."
    * Learning and adaptation to prevent future errors.

### 5.8. Learning and Adaptation Module

This module enables the system to learn from user feedback and manual interventions.

* **User Intervention Recording:**
    * Playwright event listeners capture user actions (mouse/keyboard, page changes).
    * Recorded actions are stored in a structured format.
* **Analysis of User Interventions:**
    * Comparing AI's failed attempts with user's successful actions.
    * Analyzing selector errors, missing steps, timing issues.
* **Storing Learned Patterns:**
    * Rules and contextual action sequences are stored to represent learned corrections.
* **Applying Learned Patterns:**
    * Matching current context with stored patterns.
    * Applying corrected actions (selectors, wait conditions, action sequences).
    * Confidence scores for patterns.
* **Iterative Learning and Refinement:**
    * Monitoring results of applied patterns.
    * Adjusting pattern confidence scores.
    * Using user feedback.
* **Potential Future ML Integration:**
    * Advanced pattern recognition and action prediction.

### 5.9. Deployment Strategy

This section outlines the deployment process.

* **Frontend Deployment (React/Vue.js):**
    * Static site hosting (Netlify, Vercel, AWS S3).
    * Containerization (Docker, Kubernetes).
* **Backend Deployment (Node.js/Express.js):**
    * Platform as a Service (Heroku, AWS Elastic Beanstalk, Google App Engine).
    * Infrastructure as a Service (AWS EC2, Google Compute Engine, Azure VMs).
    * Serverless (AWS Lambda, Google Cloud Functions, Azure Functions).
* **Supabase Setup and Configuration:**
    * Supabase project creation.
    * Database schema configuration.
    * Authentication and authorization setup.
    * Supabase environment variables.
* **Continuous Integration and Continuous Deployment (CI/CD):**
    * Tools (GitHub Actions, GitLab CI/CD, Jenkins, CircleCI).
    * Pipeline stages (build, test, deploy).
    * Automation and rollback mechanisms.
* **Monitoring and Logging:**
    * Application monitoring tools (Prometheus, Grafana, Datadog).
    * Structured logging (JSON).
    * Centralized logging service (ELK stack, Sentry).
* **Scalability Considerations:**
    * Horizontal scaling.
    * Database scaling.
    * Caching.
    * Load balancing.
* **Rollback Strategy:**
    * Versioning deployments.
    * Rollback capabilities.
    * Database backups.

## 6. Development Approach

Iterative development is used, focusing on core functionalities first:

1.  Basic Loom URL input and display.
2.  User login/signup with Supabase.
3.  Basic video chunking and display.
4.  Playwright integration for local action replication.
5.  Manual user takeover and recording.
6.  Saving and loading agents to Supabase.
7.  Basic agent dashboard.
8.  GitHub integration for exporting agent configurations.
9.  AI-driven Make.com/Zapier integration suggestions.
10. Functionality to trigger Make.com/Zapier workflows.
11. Full automation on a virtual machine.

## 7. Future Enhancements

* More advanced visual analysis and action recognition using machine learning.
* More sophisticated AI for Make.com/Zapier integration.
* Ability to share agents with other users.
* Scheduling of automated tasks.
* More detailed reporting and analytics on automation success.
* Support for other video platforms besides Loom.

This comprehensive document serves as the design blueprint for the Loom-Based Web Automation Agent, integrating details from all sub-documents to provide a complete and actionable specification.