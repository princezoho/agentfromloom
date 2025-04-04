# Automation Engine Design

**Version:** 1.0
**Date:** April 4, 2025
**Author:** JEJE Studios
**Related Document:** [Project Design Document](./README.md)

## 1. Introduction

This document details the design of the Automation Engine, the core component of the Loom-Based Web Automation Agent. The Automation Engine is responsible for translating the analyzed Loom video data and user feedback into executable instructions for controlling a web browser and automating user actions. It leverages the Playwright library and incorporates error handling and learning mechanisms.

## 2. Playwright Integration

### 2.1. Browser Initialization and Control

* The Automation Engine will use Playwright to launch and control a web browser instance.
* The browser can be launched in both:
    * **Headed Mode:** For debugging and visualization during development.
    * **Headless Mode:** For efficient, automated execution in production.
* Playwright's API will be used to:
    * Navigate to URLs (`page.goto()`).
    * Find and interact with UI elements (e.g., `page.click()`, `page.fill()`, `page.selectOption()`).
    * Evaluate JavaScript within the browser context (`page.evaluate()`).
    * Take screenshots (`page.screenshot()`).
    * Manage browser context and cookies.

### 2.2. Mapping Analyzed Actions to Playwright Commands

* The analyzed Loom video data (from the Loom Video Analysis Module) will be structured in a way that allows for easy translation into Playwright commands.
* This will involve mapping:
    * Transcript keywords and phrases to Playwright methods.
    * Identified UI elements (based on OCR and visual analysis) to Playwright selectors (CSS, XPath, text-based selectors).
    * Extracted data from the transcript to input values for form fields.
* **Examples:**
    * Transcript: "Click the 'Add to Cart' button."
        * Translated to Playwright: `page.getByText('Add to Cart').click()`
    * Transcript: "Enter 'user@example.com' in the email field."
        * Translated to Playwright: `page.getByLabel('Email Address').fill('user@example.com')`
    * Transcript: "Go to the Shopify admin page."
        * Translated to Playwright: `page.goto('https://yourshop.myshopify.com/admin')`

### 2.3. Strategies for Locating UI Elements

* **Text-Based Selectors:** Playwright's `getByText()` and similar methods will be prioritized for finding elements based on their visible text content, as this often aligns with the transcript.
* **CSS Selectors:** If text-based selectors are insufficient, CSS selectors will be used to target elements based on their class, ID, or other attributes.
* **XPath Selectors:** XPath can be used for more complex element selection but should be used sparingly as it can be less robust to website changes.
* **Visual Context (Future):** In the future, we could incorporate visual analysis data (e.g., element position, size, and relationship to other elements) to improve element selection, especially in cases where multiple elements have similar text.
* **Handling Dynamic Content:**
    * Playwright's auto-waiting features will be used to wait for elements to appear on the page before interacting with them.
    * Strategies for handling asynchronous operations and page updates will be implemented (e.g., waiting for specific network requests to complete).

### 2.4. Handling User Input

* When the Loom video shows a user entering text into a form field, the corresponding text will be extracted from the transcript and used as the input value in Playwright's `fill()` method.
* Placeholders or intelligent data generation might be needed if the exact input is not available in the transcript (e.g., for passwords).

## 3. Error Handling within Automation

### 3.1. Try-Catch Blocks

* Each Playwright action will be wrapped in a `try-catch` block to handle potential exceptions.
* Specific error types will be caught and handled appropriately (e.g., `TimeoutError` for element not found, `Error` for navigation failures).

### 3.2. Detailed Error Logging

* All errors encountered during automation will be logged with:
    * Timestamp.
    * Description of the attempted action.
    * Playwright command that failed.
    * Error message from Playwright.
    * URL of the page where the error occurred.
    * Screenshot of the page (if possible).
* Logs will be stored in a structured format for analysis and debugging.

### 3.3. Pausing and Resuming Automation

* The Automation Engine will support pausing and resuming automation at any point. This is crucial for user intervention and debugging.
* The state of the browser and the automation process will be saved to allow for seamless resumption.

## 4. AI-Driven Integration Suggestions

### 4.1. Identifying Integration Opportunities

* The AI will analyze the sequence of Playwright actions and the overall goal of the automated task (as defined by the user) to identify opportunities to replace browser automation with direct API calls or integrations with Make.com/Zapier.
* Patterns to look for:
    * Common e-commerce actions (e.g., creating orders, updating inventory) that often have corresponding Shopify API endpoints.
    * Data transfer between applications, which is a prime use case for Make.com/Zapier.
    * Repetitive data entry tasks that could be automated via APIs.

### 4.2. Suggesting Make.com/Zapier Modules

* If an integration opportunity is identified, the AI will suggest specific modules or actions within Make.com or Zapier that could be used.
* This will require knowledge of the capabilities of these platforms and their available integrations.
* The suggestions will be presented to the user in the UI, allowing them to choose whether to use browser automation or the suggested integration.

### 4.3. Implementing the Integration (Initial Phase)

* Initially, the actual implementation of the Make.com/Zapier integration might involve:
    * Guiding the user through the setup process within Make.com/Zapier.
    * Providing the necessary data to trigger the integration from our application.
* In the future, we could explore more automated ways to create and configure Make.com/Zapier scenarios directly from our application.

## 5. Learning and Adaptation

### 5.1. Recording User Interventions

* When the user takes control and manually performs actions, the Automation Engine will record these actions using Playwright's event listeners.
* The recorded actions will be stored in a structured format, along with the context of the failed automated steps.

### 5.2. Analyzing Correction Patterns

* The system will compare the AI's failed attempts with the user's successful manual actions to identify patterns and differences.
* This analysis can involve:
    * Identifying incorrect element selectors.
    * Recognizing missing wait conditions.
    * Understanding alternative interaction methods.

### 5.3. Applying Learned Corrections

* The learned correction patterns will be used to:
    * Adjust the Playwright commands for future automation attempts in similar situations.
    * Improve the accuracy of element selection and action execution.
    * Potentially refine the AI's suggestions for Make.com/Zapier integrations.

## 6. Output of the Automation Engine

The Automation Engine produces:

* A sequence of executable Playwright commands for each chunk.
* Logs of the automation process, including any errors and user interactions.
* Data used for learning and adaptation.

This document provides a detailed specification for the Automation Engine, covering Playwright integration, error handling, integration suggestions, and the learning mechanism. This is the core logic that drives the automation of web tasks.

**What sub-document would you like to create next?**