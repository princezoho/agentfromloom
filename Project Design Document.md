# Project Design Document: Loom-Based Web Automation Agent

**Version:** 1.0
**Date:** April 4, 2025
**Author:** JEJE Studios

## 1. Introduction

This document outlines the design and functionality of a web application that allows users to automate web-based tasks by analyzing Loom videos. The system will enable users to record repetitive online actions, have the AI understand and replicate those actions, learn from user feedback, and eventually automate these tasks efficiently through browser automation, direct API integrations, and workflow platforms like Make.com and Zapier. The goal is to create reusable "agents" that can streamline workflows and eliminate manual effort.

## 2. Goals

* Enable users to automate web tasks simply by providing a Loom video.
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

The application will take a Loom video URL as input. The AI will analyze the video (including transcript and visual elements) to understand the sequence of actions. The user will be able to review and refine these actions, breaking them into manageable chunks. The system will then attempt to automate these chunks using browser automation (Playwright). Through user feedback and manual interventions, the AI will learn and improve. Successful automation sequences can be saved as reusable "agents" and managed through a web dashboard and a GitHub repository. The system will also intelligently suggest and utilize integrations with Make.com and Zapier to further enhance automation capabilities.

## 5. Detailed Functionality

### 5.1. Loom Video Analysis

* **Input:** User provides a Loom video URL via a simple input field on the homepage.
* **Transcript Processing:** Access and analyze the Loom video's transcript to understand the narrative, identify keywords related to actions and platforms, and infer user intent.
* **URL Extraction:** Continuously extract the displayed URL throughout the video using OCR.
* **Visual Analysis (Initial):** Basic analysis of visual elements (mouse clicks, page transitions) to correlate with transcript and URL changes.
* **OCR on Visual Elements:** Use OCR to read text content of UI elements (buttons, links, labels) to identify targets of user actions.
* **Chunking:** Automatically and/or manually break down the Loom video and the corresponding actions into smaller, logical chunks with timestamps.

### 5.2. User Interface

* **Homepage:** Simple input field for Loom URL and a button to initiate analysis.
* **Login/Signup:** Secure user account creation and management (email/password, Google login via Supabase).
* **Chunk Management:**
    * List of chunks with timestamps and user-defined names/descriptions.
    * Embedded player for the full Loom video.
    * Micro-video players for each individual chunk.
    * Status indicators for each chunk (Not Started, In Progress, Success, Failed, Skipped).
    * Controls for running, re-running, skipping, and editing chunks.
    * Visual progress bar for overall automation status.
* **Feedback and Intervention:**
    * Display of AI's attempted actions and any encountered errors.
    * "Try Again" button for AI to attempt self-correction.
    * "Take Control and Record" mode for manual user intervention and recording of actions.
    * Mechanism for saving user-corrected actions.
* **Agent Dashboard:**
    * List of saved agents with names, descriptions, and status.
    * Actions for each agent: Run, Edit, View Details, Export to GitHub, Delete.
* **Settings/Integrations:** (To be implemented later) Section for connecting accounts with Make.com, Zapier, and configuring GitHub repository.

### 5.3. Automation Engine

* **Browser Automation (Playwright):** Use Playwright with TypeScript to programmatically control a web browser and replicate the actions observed in the Loom video.
* **Action Translation:** Translate the analyzed Loom data and user feedback into specific Playwright commands (navigation, clicking, typing, etc.).
* **Error Handling:** Implement robust error handling to identify and manage issues during automation.
* **Learning Mechanism:** Analyze user feedback and manual interventions to improve the accuracy and reliability of future automation attempts.

### 5.4. Integration with External Platforms

* **Make.com and Zapier:**
    * Early integration prompting for user account connection.
    * AI-driven suggestions for replacing browser automation steps with pre-built modules or workflows in these platforms based on the identified tasks and goals.
    * Mechanism to trigger Make.com/Zapier scenarios from the web application.
* **GitHub:**
    * User authentication with GitHub (OAuth).
    * Option to select an existing or create a new repository for agent storage.
    * Functionality to export the complete agent configuration (chunks, learned actions, integration details) to a structured file in the GitHub repository.

### 5.5. Agent Management

* **Saving Agents:** Allow users to save the analyzed Loom and the configured automation steps as reusable agents.
* **Loading Agents:** Enable users to load and run previously saved agents from the dashboard.
* **Execution Modes:** Support automatic execution, verification mode, and detailed logging for running agents.

## 6. Technology Stack

* **Frontend:** React (with TypeScript) - Chosen for its flexibility and large ecosystem.
* **Backend:** Node.js with Express.js - Chosen for its full-stack JavaScript/TypeScript compatibility and asynchronous capabilities.
* **Browser Automation:** Playwright (with TypeScript) - Chosen for its modern architecture, reliability, and multi-browser support.
* **Data Storage and User Management:** Supabase (PostgreSQL, Authentication, Storage) - Chosen for its robust features, ease of use, and free tier.
* **Integration Platforms:** Make.com, Zapier, GitHub.
* **Video/Transcript Analysis:** Loom API (for transcript access), OCR libraries (e.g., Tesseract.js for frontend or as a service), Natural Language Processing (NLP) libraries in Node.js (e.g., natural).

## 7. User Flow

1.  User enters Loom URL on the homepage.
2.  User logs in or signs up.
3.  System analyzes Loom video and presents initial chunk breakdown.
4.  User reviews and configures chunks (adjust boundaries, add names, define overall goal).
5.  User connects accounts with Make.com, Zapier, and GitHub.
6.  User initiates semi-automated execution of chunks.
7.  AI attempts automation, prompts for feedback or offers "Try Again."
8.  User can manually take over and record actions.
9.  AI learns from user interactions.
10. User saves the configured agent, which is also pushed to their GitHub repository.
11. User can run saved agents from the dashboard in various modes (automatic, verification).
12. System intelligently suggests and utilizes Make.com/Zapier integrations where applicable.
13. User monitors and manages agents through the dashboard.

## 8. Future Enhancements

* More advanced visual analysis and action recognition using machine learning.
* More sophisticated AI for suggesting and configuring Make.com/Zapier integrations.
* Ability to share agents with other users.
* Scheduling of automated tasks.
* More detailed reporting and analytics on automation success.
* Support for other video platforms besides Loom.

## 9. Development Approach

Iterative development with a focus on building core functionalities first:

1.  Basic Loom URL input and display.
2.  User login/signup with Supabase.
3.  Basic video chunking and display in the UI.
4.  Integration with Playwright for basic action replication on the user's local machine.
5.  Mechanism for manual user takeover and recording.
6.  Saving and loading agents to Supabase.
7.  Basic agent dashboard.
8.  Integration with GitHub for exporting agent configurations.
9.  Implementation of AI-driven suggestions for Make.com/Zapier integrations.
10. Functionality to trigger Make.com/Zapier workflows.
11. Full automation capabilities and potential deployment to a virtual machine.

This document provides a comprehensive overview of the project. As development progresses, we will continue to refine and add details to this document.