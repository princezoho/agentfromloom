# Fail Book / Anti-Patterns Guide: AI Behavior in Loom-Based Web Automation

**Project:** Loom-Based Web Automation Agent
**Version:** 1.3
**Date:** April 4, 2025
**Author:** Gemini AI

## 1. Introduction

This document serves as a "Fail Book" or Anti-Patterns Guide, outlining common pitfalls and undesirable behaviors that the AI might exhibit during the development of the Loom-Based Web Automation Agent. It aims to help developers identify when the AI's logic is deviating from the intended path and needs correction.

## 2. General Principles (Undesirable AI Behaviors)

* **Over-Optimization for Single Goal:** The AI excessively prioritizes achieving a single goal (e.g., logging in) while neglecting overall functionality or causing destructive side effects.
* **Ignoring Context:** The AI performs actions without considering the broader context of the user's intended workflow, leading to illogical or irrelevant steps.
* **Infinite Loops:** The AI gets stuck in repetitive cycles of retrying the same action without any progress or attempt to seek alternative solutions.
* **Destructive Actions:** The AI attempts actions that have irreversible consequences (e.g., deleting data) without any form of confirmation or safety check.
* **Unnecessary Complexity:** The AI introduces overly convoluted or redundant steps into the automation process, leading to inefficiency and fragility.
* **Deviation from Loom:** The AI's actions significantly diverge from the observed actions in the Loom video without a clear and justifiable reason for optimization.

## 3. Specific Anti-Patterns (Observable AI Behaviors)

### 3.1. Login-Related Anti-Patterns

* **Deleting Features for Login:** The AI removes or disables unrelated UI elements or features in an attempt to bypass login obstacles.
    * **Example:** The AI deletes a "Remember Me" checkbox element.
* **Infinite Login Loops:** The AI repeatedly attempts to log in with the same credentials or method despite consistent failures.
    * **Example:** The AI continuously submits the same incorrect password.
* **Ignoring Multi-Factor Authentication (MFA):** The AI fails to recognize or handle MFA prompts, halting the automation.
    * **Example:** The AI gets stuck at an MFA verification code input screen.
* **Bypassing Security Measures:** The AI attempts unauthorized or potentially harmful methods to circumvent security measures like CAPTCHAs.
    * **Example:** The AI tries to automatically solve a CAPTCHA.

### 3.2. Navigation-Related Anti-Patterns

* **Random Navigation:** The AI navigates to unrelated pages or clicks on arbitrary links without a clear connection to the intended task.
    * **Example:** The AI clicks on advertisements or footer links.
* **Getting Stuck in Navigation Loops:** The AI repeatedly navigates between the same pages in a pointless cycle.
    * **Example:** The AI oscillates between a product page and the homepage.
* **Ignoring Dynamic Content:** The AI fails to wait for dynamically loaded elements, leading to errors or incorrect actions.
    * **Example:** The AI tries to click a button that hasn't finished loading.

### 3.3. Data Handling Anti-Patterns

* **Incorrect Data Extraction:** The AI extracts the wrong data from a web page, leading to inaccurate automation.
    * **Example:** The AI retrieves the wrong product price.
* **Data Loss:** The AI unintentionally clears or overwrites data during the automation process.
    * **Example:** The AI clears a form field before submitting it.
* **Data Injection:** The AI attempts to insert data into unintended or inappropriate places on the page.
    * **Example:** The AI enters data into the wrong input field.

### 3.4. General Automation Anti-Patterns

* **Overly Complex Selectors:** The AI generates excessively long or specific CSS or XPath selectors that are fragile and easily broken by website changes.
    * **Example:** The AI uses a selector that relies on a specific table row index.
* **Ignoring User Intent:** The AI performs actions without considering the overall goal of the automation, leading to illogical or destructive steps.
    * **Example:** The AI clicks a "Delete" button without verifying the context.
* **Unnecessary Delays:** The AI introduces long and unjustified pauses into the automation process, slowing it down.
    * **Example:** The AI uses arbitrary `setTimeout` calls.
* **Failure to Learn:** The AI repeats the same errors or incorrect actions despite previous failures or user feedback.
    * **Example:** The AI continues to use a broken selector after it has been corrected.
* **Attempting Unrealistic Visual Generation:** The AI attempts to generate or manipulate complex visual elements (e.g., drawing images, creating SVGs) in a way that is likely to produce nonsensical or unintended results.
    * **Example:** The AI tries to use Playwright to draw a complex shape on a `<canvas>` element.

## 4. Mitigation Strategies (Developer Observations)

This section outlines observable symptoms that indicate the presence of the anti-patterns described above. These observations should prompt developers to investigate and address the underlying issues in the AI's logic or the automation engine.

* **Regular Monitoring (Observation):** Frequent instances of the AI performing unexpected, illogical, or destructive actions.
* **Detailed Logging (Observation):** Error logs containing recurring failures, incorrect data retrieval, or unexpected code execution paths.
* **Code Reviews (Observation):** Code exhibiting overly complex logic, fragile selectors, or insufficient error handling.
* **Testing and Validation (Observation):** Test cases failing due to the AI's inability to handle variations in website structure or data, or due to incorrect action sequences.
* **User Feedback (Observation):** User reports of the automation behaving erratically, producing incorrect results, or causing unintended consequences.
* **Refactoring (Observation):** Difficulty in adapting the code to new scenarios or fixing identified problems due to its complexity or lack of modularity.
* **Attempting Unrealistic Visual Generation (Observation):** The AI's actions include Playwright commands or code that attempts complex drawing or visual manipulation with little or no context, resulting in nonsensical or unpredictable outcomes.

## 5. Conclusion

This Fail Book serves as a guide for developers to identify and address undesirable AI behavior during the development of the Loom-Based Web Automation Agent. Recognizing these anti-patterns early on is crucial for building a reliable, robust, and user-friendly automation system.