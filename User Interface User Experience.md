# User Interface (UI) and User Experience (UX) Specification

**Version:** 1.0
**Date:** April 4, 2025
**Author:** JEJE Studios
**Related Document:** [Project Design Document](./README.md)

## 1. Introduction

This document outlines the design and user experience (UX) for the web application that enables Loom-based web automation. The goal is to create a simple, intuitive, and efficient interface that guides users through the process of analyzing Loom videos, managing automation chunks, providing feedback, and running automated agents.

## 2. Homepage

* **Purpose:** The entry point for users to initiate the automation process.
* **Elements:**
    * **Headline:** Clear and concise headline explaining the application's core functionality (e.g., "Automate Web Tasks from Loom Videos").
    * **Loom Video URL Input Field:** A large, clearly labeled text input field (e.g., "Enter Loom Video URL").
    * **Submit Button:** A prominent button next to the input field (e.g., "Analyze Loom" or "Get Started").
    * **Optional Introductory Text/Instructions:** Brief explanation of how to use the application.
    * **Link to Login/Signup:** If the user is not logged in, a clear link to the login or signup page.
* **User Flow:**
    1.  User lands on the homepage.
    2.  User pastes a Loom video URL into the input field.
    3.  User clicks the "Analyze Loom" button.
    4.  If not logged in, the user is redirected to the Login/Signup page. Otherwise, the system proceeds with Loom analysis and redirects to the Chunk Management screen.

## 3. Login/Signup Page

* **Purpose:** To authenticate existing users and allow new users to create an account.
* **Elements:**
    * **Headline:** Clear indication of the page's purpose (e.g., "Login" or "Sign Up").
    * **Email Input Field:** For entering the user's email address.
    * **Password Input Field:** For entering the user's password (masked input).
    * **Login Button:** To submit login credentials.
    * **"Forgot Password?" Link:** To initiate password recovery.
    * **Signup Section:**
        * Option to create a new account using email and password (with password confirmation field).
        * Signup Button.
    * **Social Login Options:** Buttons for "Sign in with Google" (leveraging Supabase's social login).
    * **Link back to Homepage:** Option to return to the homepage.
* **User Flow:**
    1.  User is redirected to this page from the homepage if not logged in.
    2.  Existing users enter their email and password and click "Login."
    3.  New users enter their email and password (and confirmation) and click "Sign Up."
    4.  Users can also choose to log in with their Google account.
    5.  Upon successful authentication, the user is redirected to the Chunk Management screen with the analyzed Loom data.

## 4. Chunk Management Screen

* **Purpose:** To allow users to review, manage, and execute the automated tasks broken down into chunks.
* **Elements:**
    * **Agent Title/Loom URL Display:** Clear indication of the currently loaded Loom video or agent name.
    * **Chunk List:**
        * An ordered list of identified chunks.
        * Each item in the list displays the chunk number, start/end timestamp (if available), and user-defined name (if provided).
        * A status indicator (e.g., colored circle or icon) for each chunk (Not Started, Completed Successfully, Failed, Skipped, Needs Review).
    * **Main Loom Video Player:** An embedded video player displaying the full Loom recording. The current chunk being viewed or executed can be highlighted on the timeline.
    * **Micro-Video Players (Chunk Previews):** A horizontal or grid layout of small video players, each corresponding to a chunk in the list. These provide quick visual references.
    * **Chunk Details Panel (when a chunk is selected):**
        * Displays the chunk name, description (if any), start/end times.
        * Buttons: "Run," "Re-run," "Skip," "Edit Name/Description."
        * A status area showing the result of the last execution of this chunk.
    * **Global Controls:**
        * "Run All Chunks" button.
        * Progress bar indicating the overall completion status.
        * "Save Agent" button.
        * "Export to GitHub" button (initially might be disabled or a placeholder).
        * Link to the Agent Dashboard.

* **User Flow:**
    1.  User is redirected here after successful login and Loom analysis.
    2.  User can review the list of chunks and watch the corresponding micro-videos to understand the proposed segmentation.
    3.  User can select a chunk from the list to view its details and available actions.
    4.  User can run individual chunks or all chunks sequentially.
    5.  Status indicators update based on the execution results.
    6.  User can save the current configuration as a new or updated agent.
    7.  User can navigate to the Agent Dashboard to manage other saved agents.

## 5. Feedback and Intervention UI (within Chunk Management)

* **Purpose:** To provide feedback on the AI's automation attempts and allow user intervention when needed.
* **Elements (displayed when a chunk fails or needs review):**
    * **AI Attempt Log:** A section displaying the actions the AI attempted to perform for the current chunk, including Playwright commands and any error messages. Screenshots at the point of failure can be embedded here.
    * **"Try Again" Button:** To instruct the AI to re-attempt the automation for this chunk, potentially with slight adjustments.
    * **"Take Control and Record" Button:** A prominent button to allow the user to manually perform the actions.
    * **Recording Indicator:** When "Take Control" is active, a clear visual indicator (e.g., a flashing icon and message) should inform the user that their actions are being recorded.
    * **"Resume Automation" or "Save and Continue" Button (after manual takeover):** To signal the completion of manual actions and integrate them into the workflow.
    * **Feedback Input (Optional):** A text area for the user to provide specific feedback on why the automation failed or what they did differently.

* **User Flow:**
    1.  User runs a chunk.
    2.  If the automation fails, the Feedback and Intervention UI is displayed for that chunk.
    3.  User can review the AI's attempt and the error log.
    4.  User can click "Try Again" to let the AI retry.
    5.  If "Try Again" fails or the user chooses, they can click "Take Control and Record" and perform the actions manually.
    6.  After manual intervention, the user clicks "Resume Automation" or "Save and Continue."
    7.  The status of the chunk is updated based on the outcome.

## 6. Agent Dashboard

* **Purpose:** To provide an overview of all saved automation agents and allow users to manage them.
* **Elements:**
    * **Headline:** "My Agents" or similar.
    * **List of Agents:**
        * Each item displays the agent name, description (if provided), creation date, and current status (e.g., "Working," "Needs Review," "Failed").
        * Action buttons for each agent: "Run," "Edit Chunks," "View Details," "Export to GitHub," "Delete."
    * **"Create New Agent" Button:** To initiate the process with a new Loom video URL.

* **User Flow:**
    1.  User navigates to the Agent Dashboard.
    2.  User sees a list of their saved agents with their status and descriptions.
    3.  User can click "Run" to execute an agent.
    4.  User can click "Edit Chunks" to go back to the Chunk Management screen for a specific agent.
    5.  User can click "View Details" to see the execution history or detailed configuration of an agent.
    6.  User can click "Export to GitHub" to save the agent configuration to their repository.
    7.  User can click "Delete" to remove an agent.
    8.  User can click "Create New Agent" to start the process with a new Loom video.

This document provides a detailed specification for the user interface and user experience of the Loom-based web automation application. It covers the key screens and user interactions involved in the automation workflow. Further visual mockups and wireframes would be beneficial in a more advanced stage of design.