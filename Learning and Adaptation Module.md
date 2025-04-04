# Learning and Adaptation Module

**Version:** 1.0
**Date:** April 4, 2025
**Author:** JEJE Studios
**Related Document:** [Project Design Document](./README.md)

## 1. Introduction

This document details the design and functionality of the Learning and Adaptation Module, which is responsible for enabling the Loom-Based Web Automation Agent to learn from user feedback and manual interventions. This learning process is crucial for improving the accuracy and robustness of the automation over time.

## 2. User Intervention Recording

* When the user takes control and manually performs actions during the semi-automated execution, the system must record these actions.
* **Recording Mechanism:**
    * Playwright's event listeners can be used to capture user interactions within the browser (mouse clicks, keyboard input, etc.).
    * Changes to the web page's state (e.g., element properties, content updates) should also be recorded.
* **Data Structure for Recorded Actions:**
    * A structured format (e.g., JSON) will be used to represent the recorded user actions.
    * Each action object will include:
        * Action type (e.g., "click," "fill," "navigate").
        * Target element selector (CSS, XPath).
        * Input value (for "fill" actions).
        * Timestamp.
    * The recorded actions will be stored in the `learned_actions` column of the `Chunks` table, associated with the specific chunk where the intervention occurred.

## 3. Analysis of User Interventions

* The system will analyze the recorded user actions in the context of the AI's failed attempts to understand *why* the automation failed and *how* the user corrected it.
* **Analysis Techniques:**
    * **Comparison of Expected vs. Actual State:** Compare the state of the web page before the AI's failed attempt with the state after the user's successful intervention. This can help identify differences in element properties or content.
    * **Selector Analysis:** If the AI used an incorrect element selector, analyze the user's clicks or interactions to determine the correct selector.
    * **Action Sequence Analysis:** Compare the sequence of actions the AI attempted with the sequence of actions the user performed to identify missing or incorrect steps.
    * **Timing Analysis:** Analyze the timing of user actions to identify potential wait conditions that the AI missed.

## 4. Storing Learned Patterns

* The system will store the analyzed correction patterns in a way that allows them to be applied to future automation attempts.
* **Data Structures for Learned Patterns:**
    * **Rules:** Define rules that map specific failure scenarios to corresponding correction strategies.
        * Example: "If 'Element with text 'Submit' not found' and user clicked 'button.primary' with text 'Submit', then use 'button.primary' selector in the future."
    * **Contextual Action Sequences:** Store the sequence of user actions that successfully corrected a specific failure, along with the context in which the failure occurred (e.g., the URL, the state of the surrounding elements).
* **Storage Location:** Learned patterns can be stored:
    * Within the `learned_actions` JSONB column in the `Chunks` table, associated with the chunk where the learning occurred.
    * In a separate table or data store for global application across multiple agents.

## 5. Applying Learned Patterns

* Before attempting an automated action, the system will check if there are any learned patterns that are relevant to the current context.
* **Pattern Matching:**
    * Match the current page state, element selectors, and intended action with the conditions of stored rules or contextual action sequences.
* **Applying Corrections:**
    * If a matching pattern is found, apply the corresponding correction strategy:
        * Use the corrected element selector.
        * Insert the missing wait condition.
        * Execute the corrected sequence of actions.
* **Confidence Scores:**
    * Assign confidence scores to learned patterns based on their frequency of successful application.
    * Prioritize applying patterns with higher confidence scores.

## 6. Iterative Learning and Refinement

* The learning process will be iterative. The system will continuously learn and refine its patterns as more user interventions occur.
* **Feedback Loop:**
    * The results of applying learned patterns will be monitored.
    * If a pattern leads to a successful automation, its confidence score is increased.
    * If a pattern leads to a failure, its confidence score is decreased, or the pattern is modified.
* **User Feedback:**
    * Explicit user feedback (e.g., through a feedback form) can be used to further refine the learning process.

## 7. Potential Future ML Integration

* In the future, we could explore integrating machine learning models for more advanced pattern recognition and action prediction.
* **Potential ML Applications:**
    * Predicting the most likely user action in a given context.
    * Identifying complex UI patterns and relationships between elements.
    * Generalizing learned knowledge to new websites and scenarios.

This document provides a detailed specification for the Learning and Adaptation Module, covering the mechanisms for recording user interventions, analyzing correction patterns, applying learned knowledge, and iteratively refining the automation process. This module is essential for making the Loom-Based Web Automation Agent truly intelligent and adaptable.

**What sub-document would you like to create next?**