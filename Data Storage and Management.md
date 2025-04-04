# Data Storage and Management

**Version:** 1.0
**Date:** April 4, 2025
**Author:** Gemini AI
**Related Document:** [Project Design Document](./README.md)

## 1. Introduction

This document details the data storage and management strategy for the Loom-Based Web Automation Agent. We will be using Supabase as our primary data storage solution, leveraging its PostgreSQL database, authentication features, and storage capabilities. This document outlines the database schema, API interactions, and data security considerations.

## 2. Supabase Setup

* A Supabase project will be created to host our application's data.
* Supabase's authentication features will be used to manage user accounts and authentication.
* Supabase's PostgreSQL database will be used to store structured data (users, agents, chunks, etc.).

## 3. Detailed Database Schema

The following tables will be created in the Supabase PostgreSQL database:

### 3.1. Users Table

* **Purpose:** Stores user account information.
* **Columns:**
    * `id` (UUID, Primary Key): Unique identifier for each user.
    * `email` (VARCHAR, 255, Unique, Not Null): User's email address for login.
    * `password_hash` (VARCHAR, 255, Not Null): Hashed password (Supabase handles this).
    * `created_at` (TIMESTAMP WITH TIME ZONE, Not Null): Timestamp of account creation.
    * `updated_at` (TIMESTAMP WITH TIME ZONE, Not Null): Timestamp of last account update.
    * * Potentially other user profile information in the future (e.g., settings).

### 3.2. Agents Table

* **Purpose:** Stores metadata about saved automation agents.
* **Columns:**
    * `id` (UUID, Primary Key): Unique identifier for each agent.
    * `user_id` (UUID, Foreign Key referencing `Users.id`, Not Null, On Delete Cascade): The user who created this agent.
    * `name` (VARCHAR, 255, Not Null): User-defined name for the agent.
    * `description` (TEXT): User-provided description of the agent's purpose (optional).
    * `loom_url` (VARCHAR, 255, Not Null): The original Loom video URL.
    * `created_at` (TIMESTAMP WITH TIME ZONE, Not Null): Timestamp of agent creation.
    * `updated_at` (TIMESTAMP WITH TIME ZONE, Not Null): Timestamp of last agent update.
    * `github_repo_url` (VARCHAR, 255): Link to the GitHub repository where this agent's configuration is stored (optional).

### 3.3. Chunks Table

* **Purpose:** Stores information about the individual chunks within an agent's workflow.
* **Columns:**
    * `id` (UUID, Primary Key): Unique identifier for each chunk.
    * `agent_id` (UUID, Foreign Key referencing `Agents.id`, Not Null, On Delete Cascade): The agent this chunk belongs to.
    * `order` (INTEGER, Not Null): The order in which this chunk appears in the sequence (used for sorting).
    * `start_time` (VARCHAR, 20): Start timestamp of this chunk in the Loom video (optional).
    * `end_time` (VARCHAR, 20): End timestamp of this chunk in the Loom video (optional).
    * `name` (VARCHAR, 255): User-defined name for the chunk (optional).
    * `status` (VARCHAR, 20, Not Null): Current status of the chunk (e.g., "Not Started," "Completed," "Failed," "Skipped," "Needs Review").
    * `learned_actions` (JSONB, Not Null): Stores the sequence of learned or manually recorded actions for this chunk. The structure of this JSON will be defined later but will likely contain an array of action objects.
    * `error_details` (JSONB): Stores details of any errors encountered during the execution of this chunk (optional). This can include error messages, timestamps, and screenshots.
    * `created_at` (TIMESTAMP WITH TIME ZONE, Not Null).
    * `updated_at` (TIMESTAMP WITH TIME ZONE, Not Null).

### 3.4. Future Tables

* We might need additional tables for:
    * Temporary data during Loom analysis.
    * Detailed logging of automation execution.
    * Storing API keys or credentials (with encryption).
    * Managing user settings and preferences.

## 4. API Interactions with Supabase

* The backend (Node.js/Express.js) will interact with the Supabase API using the Supabase client library for Node.js.
* Common API operations will include:
    * **User Authentication:**
        * Creating new users (signup).
        * Verifying user credentials (login).
        * Handling social logins (e.g., Google).
    * **Data Retrieval:**
        * Fetching user data.
        * Fetching agent data (by user ID).
        * Fetching chunk data (by agent ID).
    * **Data Creation:**
        * Creating new agents.
        * Creating new chunks.
    * **Data Update:**
        * Updating agent metadata (name, description).
        * Updating chunk status and learned actions.
    * **Data Deletion:**
        * Deleting agents and their associated chunks.
* Supabase's realtime functionality might be used to push updates to the UI (e.g., chunk status changes).

## 5. Data Security and Privacy

* **Authentication:** Supabase's built-in authentication will be used to secure user access to data.
* **Authorization:** Row-Level Security (RLS) policies in Supabase will be implemented to ensure that users can only access their own data.
* **Password Hashing:** Supabase handles password hashing securely.
* **Data Encryption:**
    * Consider encrypting sensitive data at rest (e.g., API keys) if we decide to store them in the database.
    * Use HTTPS for all communication between the client and the server to encrypt data in transit.
* **Data Validation:** Implement server-side data validation to prevent malicious input from corrupting the database.
* **Regular Backups:** Supabase provides automatic backups, but we should also implement our own backup strategy.
* **Compliance:** Consider relevant data privacy regulations (e.g., GDPR) when designing data storage and handling procedures.

## 6. Data Migration and Updates

* A strategy for managing database schema changes and data migrations will be needed as the application evolves.
* Supabase provides tools for creating and applying database migrations.

This document provides a detailed specification for data storage and management, covering the database schema, API interactions, and security considerations. A well-defined data storage strategy is crucial for the functionality, reliability, and security of the application.

**What sub-document would you like to create next?**