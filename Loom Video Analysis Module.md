# Loom Video Analysis Module Details

**Version:** 1.0
**Date:** April 4, 2025
**Author:** JEJE Studios
**Related Document:** [Project Design Document](./README.md)

## 1. Introduction

This document provides a detailed specification for the Loom Video Analysis Module, which is a critical component of the Loom-Based Web Automation Agent. This module is responsible for taking a user-provided Loom video URL and extracting the necessary information to understand the online tasks being performed. This includes processing the video's transcript, extracting URLs, and analyzing visual elements to infer user actions and intent.

## 2. Transcript Acquisition and Processing

### 2.1. Loom API Integration

* The backend (Node.js) will interact with the Loom API to retrieve the transcript associated with the provided Loom video URL. This will likely involve using a Loom API client library or making direct HTTP requests to the Loom API endpoints.
* Authentication with the Loom API might be required, although for publicly shared Loom videos, the transcript might be accessible without explicit authentication. We need to investigate the specific requirements of the Loom API for transcript access.
* The system should handle cases where a transcript is not available for the video. In such scenarios, the analysis will need to rely more heavily on visual analysis and potentially prompt the user for additional context.

### 2.2. Transcript Data Parsing and Structuring

* The retrieved transcript data will likely be in a JSON or similar format. The system will need to parse this data to extract the spoken text and any associated metadata (e.g., timestamps).
* The parsed transcript will be structured in a way that allows for easy correlation with the timeline of the video and the actions being performed on the screen. Each transcript entry should ideally be associated with a specific time range in the video.

### 2.3. Natural Language Processing (NLP) for Intent Recognition

* Basic NLP techniques will be employed to analyze the transcript text:
    * **Keyword Extraction:** Identify key verbs (e.g., "click," "enter," "navigate," "copy," "paste") and nouns (e.g., button labels, field names, website names) that indicate user actions and targets.
    * **Intent Recognition (Initial):** Develop a set of rules or simple models to infer the user's intent based on common phrases and keywords (e.g., phrases like "add to cart" likely indicate an e-commerce purchase flow).
    * **Entity Recognition:** Identify entities such as website names (e.g., "Shopify," "Google Maps"), data types (e.g., "email address," "phone number"), and potential data values.

## 3. URL Extraction via OCR

### 3.1. OCR Library Selection

* We will need to choose an appropriate OCR library that can be integrated into our analysis pipeline. Options include:
    * **Tesseract OCR:** A widely used open-source OCR engine. It can be used via command-line interface or through wrapper libraries in Node.js (e.g., `node-tesseract-ocr`).
    * **Cloud-based OCR Services:** Services like Google Cloud Vision API or AWS Textract offer more advanced OCR capabilities and might be considered if accuracy becomes a significant challenge with local libraries. However, these would likely incur costs.
    * **Browser-based OCR (Tesseract.js):** Running OCR directly in the frontend could potentially reduce backend load but might have performance implications.

### 3.2. Video Frame Extraction

* To perform OCR, we will need to extract individual frames from the Loom video. This can be done using libraries in Node.js that can process video files (though direct processing of a remote Loom URL might be more efficient if supported by a service). Alternatively, we might rely on backend services that can provide frame-by-frame access to a video URL.

### 3.3. OCR Processing and URL Identification

* The selected OCR library will be used to process the extracted video frames, specifically focusing on the area of the browser's address bar.
* Regular expressions or specialized URL parsing libraries will be used to identify valid URLs within the OCR output.
* The system will track changes in the extracted URL over time, creating a log of the user's navigation path within the Loom video.

## 4. Visual Analysis Techniques

### 4.1. Initial Action Detection

* Changes in video frames, particularly around the mouse cursor's location, can indicate clicks. We can analyze the pixel differences between consecutive frames to detect these events.
* Page transitions (significant changes in the overall visual content of the frame) will also be tracked, often correlating with URL changes or the completion of actions.

### 4.2. Advanced OCR for UI Element Identification

* When the transcript or context suggests interaction with a UI element (e.g., a button mentioned in the transcript), OCR will be used on the video frame to identify elements with text content that matches the transcript.
* The spatial location of the mouse cursor in the video at the time of a "click" event can further help pinpoint the target element.

### 4.3. Future Integration of Computer Vision

* In the future, we could explore integrating computer vision models (e.g., trained on datasets of web UI elements) to more accurately identify and classify buttons, links, forms, and other interactive elements, even without relying solely on text content. This would require more significant development effort and potentially the use of machine learning frameworks like TensorFlow or PyTorch.

## 5. Chunking Logic

### 5.1. Automatic Chunk Segmentation

* The system will attempt to automatically segment the Loom video based on:
    * Significant pauses in user activity (detectable from video timestamps or lack of transcript).
    * Navigation to new URLs.
    * Completion of logical units of work inferred from the transcript (e.g., submitting a form).
* Heuristic rules based on common web interaction patterns can also be used for automatic segmentation.

### 5.2. User-Defined Chunk Adjustment

* The UI will provide tools for the user to review the automatically created chunks and:
    * Adjust the start and end times of each chunk.
    * Split or merge existing chunks.
    * Manually define new chunks.

### 5.3. Chunk Data Storage

* The `Chunks` table in our Supabase database will store information about each chunk, including its associated agent, order, start and end times, user-defined name, and status.

## 6. Output of the Analysis Module

The Loom Video Analysis Module will produce the following output for each provided Loom video:

* A structured representation of the video's transcript with associated timestamps (if available).
* A chronological log of URLs visited during the video.
* A set of identified actions (e.g., clicks, text entries) with their potential targets (based on OCR and visual analysis) and associated timestamps.
* A proposed set of chunks based on automatic segmentation.

This output will then be used by the Automation Engine to attempt to replicate the user's actions.

This detailed document outlines the key aspects of the Loom Video Analysis Module. It covers the necessary steps for extracting information from the Loom video and preparing it for the automation phase. We can further refine specific sections as needed.

**What would you like to work on next? Perhaps the User Interface (UI) and User Experience (UX) Specification?**