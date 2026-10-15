# BMSCE LMS Auto-Complete

A browser console script for [lms.bmsce.in](https://lms.bmsce.in). It goes through every lesson in a course and clicks
**Mark Complete** until the course progress reaches the percentage you choose.

It adds a small control panel to the page with a target percentage input, a progress bar and a live log.

## Usage

1. Log in to https://lms.bmsce.in and open the course you want (the course page or any lesson in it).
2. Press **F12** (or `Ctrl+Shift+J`) to open DevTools and switch to the **Console** tab.
3. Copy everything in [`lms-autocomplete.js`](lms-autocomplete.js), paste it into the console and press **Enter**.
   - Chrome may ask you to type `allow pasting` first. Type it, press Enter, and paste again.
4. A panel appears in the bottom-right corner. Enter a target (for example `80`) or pick a preset, then press **Start**.
5. Keep the tab open until the panel says **Target reached ✓**.

## How it works

- It starts from the first lesson of the course, so no earlier lessons are missed.
- On each lesson:
  - **Mark Complete** button: it clicks it. The site saves progress and opens the next lesson.
  - **Continue** button: the lesson is already done, so it moves on with **Next**.
  - **Neither button** (for example a quiz): it logs a skip and moves on.
- It stops when the course's own **Course Progress** figure reaches your target, or when there are no more lessons.
- It waits about a second between actions so it doesn't flood the server.

## Logging

- Each step appears in the panel and in the browser console, colour-coded as `OK`, `SKIP`, `ERR` or `INFO`.
- **Save log** downloads a tab-separated `.log` file with the time, level, progress, message and page for each step.

## Notes

- Quizzes and assignments are never attempted.
- If the page fully reloads during a run, the script stops. Paste it again and press Start. Lessons that are already done
  are skipped.
- **Stop** ends the run after the current lesson. **✕** closes the panel.
- This relies on the button labels the LMS currently uses (`Mark Complete`, `Continue`, `Next`). If the site changes,
  the script may need updating.
