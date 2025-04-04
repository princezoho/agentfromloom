# Agent Management System

**Version:** 1.0
**Date:** April 4, 2025
**Author:** JEJE Studios
**Related Document:** [Project Design Document](./README.md)

## 1. Introduction

This document details the design and functionality of the Agent Management System, which is responsible for saving, loading, managing, and executing the automated workflows created by the user. An "agent" represents a complete configuration for automating a specific task derived from a Loom video.

## 2. Agent Data Structure

* The core data for an agent will be stored in the `Agents` and `Chunks` tables in the Supabase database.
* **Agents Table:**
    * `id` (UUID, Primary Key): Unique identifier for each agent.
    * `user_id` (UUID, Foreign Key referencing `Users.id`): The user who created this agent.
    * `name` (VARCHAR): User-defined name for the agent.
    * `description` (TEXT, Optional): User-provided description of the agent's purpose.
    * `loom_url` (VARCHAR): The original Loom video URL associated with this agent.
    * `created_at` (TIMESTAMP WITH TIME ZONE): When the agent was saved.
    * `updated_at` (TIMESTAMP WITH TIME ZONE): When the agent was last updated.
    * `github_repo_url` (VARCHAR, Optional): Link to the GitHub repository where this agent's configuration is stored.
* **Chunks Table:**
    * `id` (UUID, Primary Key): Unique identifier for each chunk within an agent.
    * `agent_id` (UUID, Foreign Key referencing `Agents.id`): The agent this chunk belongs to.
    * `order` (INTEGER): The order in which this chunk appears in the sequence.
    * `start_time` (VARCHAR, Optional): Start timestamp of this chunk in the Loom video.
    * `end_time` (VARCHAR, Optional): End timestamp of this chunk in the Loom video.
    * `name` (VARCHAR, Optional): User-defined name for the chunk.
    * `status` (VARCHAR): Current status of the chunk (e.g., "Not Started," "Completed," "Failed," "Skipped," "Needs Review").
    * `learned_actions` (JSONB): Stores the sequence of learned or manually recorded actions for this chunk. The structure of this JSON will evolve as we define how we represent actions (e.g., as a list of Playwright commands or Make.com/Zapier module calls).
    * `error_details` (JSONB, Optional): Stores details of any errors encountered during the execution of this chunk.
    * `created_at` (TIMESTAMP WITH TIME ZONE).
    * `updated_at` (TIMESTAMP WITH TIME ZONE).

## 3. Saving Agents

* When the user is satisfied with the configuration of the chunks (after analysis, editing, and potentially manual intervention), they can save it as an agent.
* The system will:
    * Prompt the user to provide a name for the agent.
    * (Optionally) Allow the user to add a description.
    * Store the agent data in the `Agents` table.
    * Store the chunk data in the `Chunks` table, linking them to the agent.
    * Serialize the agent configuration into a format suitable for storage and retrieval (e.g., JSON).

## 4. Loading Agents

* From the Agent Dashboard, users can select a saved agent to load it for execution or further editing.
* The system will:
    * Retrieve the agent data from the `Agents` table.
    * Retrieve the associated chunk data from the `Chunks` table.
    * Deserialize the agent configuration to make it ready for execution.

## 5. Agent Dashboard Functionality

* The Agent Dashboard will provide the following functionalities:
    * **Agent List:**
        * Display a list of all agents created by the user.
        * Show agent name, description, creation date, and status.
        * Allow users to sort and filter agents.
    * **Agent Details:**
        * When an agent is selected, display detailed information about it.
        * Show the list of chunks with their status.
        * Provide access to the chunk editing interface.
    * **Agent Execution:**
        * Provide controls to run the agent (either all chunks sequentially or individual chunks).
        * Display the execution status and logs.
    * **Agent Management:**
        * Allow users to edit agent metadata (name, description).
        * Provide functionality to delete agents.
        * Implement the "Export to GitHub" feature (as described in the Integration with External Platforms document).
        * Potentially, in the future, support agent sharing or duplication.
    * **Agent Creation:**
        * A button or link to initiate the process of creating a new agent (which takes the user to the Homepage to enter a Loom URL).

## 6. Agent Execution Logic

* When an agent is executed, the system will:
    * Iterate through the chunks in the specified order.
    * For each chunk:
        * Execute the learned actions (Playwright commands or Make.com/Zapier calls).
        * Handle any errors that occur.
        * Update the chunk status in the UI and the database.
        * Provide feedback to the user on the execution progress.
* Different execution modes may be supported:
    * **Automatic Execution:** Run all chunks without user confirmation (for trusted agents).
    * **Verification Mode:** Prompt the user to confirm each chunk's actions before execution.
    * **Debugging Mode:** Provide detailed logging and allow pausing/stepping through the execution.

## 7. Agent Versioning (Future)

* In the future, we might consider implementing more robust versioning for agents, perhaps leveraging Git directly or using database-based versioning.
* This would allow users to:
    * Track changes to their agents over time.
    * Revert to previous versions if needed.
    * Compare different versions.

This document provides a detailed specification for the Agent Management System, covering agent data storage, saving, loading, dashboard functionality, and execution logic. This system is crucial for enabling users to effectively manage and reuse their automated workflows.

**What sub-document would you like to create next?**