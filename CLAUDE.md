# CLAUDE.md

Instructions for Claude (Claude Code, Claude in Chrome, or the Claude desktop app) when a user asks to run this
project, for example "mark my BMSCE LMS course complete up to 80%".

## What this project is

`lms-autocomplete.js` is a single, dependency-free browser script for https://lms.bmsce.in (a custom Next.js LMS).
It walks the lessons of a course in order and clicks **Mark Complete** until the course's own **Course Progress**
percentage reaches a target. There is no build step and no server. The script runs inside the user's logged-in page.

## Before you start

- **Browser:** you need a browser tool that can run JavaScript in the user's logged-in Chrome session. With Claude in
  Chrome (`mcp__claude-in-chrome__*`), load these tools in one ToolSearch call: `tabs_context_mcp`, `tabs_create_mcp`,
  `navigate`, `javascript_tool`, `get_page_text`, `computer`.
- **Login:** the user must already be logged in to lms.bmsce.in. Never type their credentials. If the page shows a login
  form, ask them to log in, then continue.
- **Course and target:** ask for the course URL (form: `https://lms.bmsce.in/courses/<slug>`) and the target percentage,
  unless they're already given. Default target: 80.

## How to run it

1. Call `tabs_context_mcp`, open a new tab and navigate to the course URL.
2. Read the current progress so you can report before and after:
   ```js
   (document.body.innerText.match(/(\d+)%\s*Your Progress[\s\S]{0,80}/) || [''])[0]
   ```
3. Inject the script. Read `lms-autocomplete.js` from this repo and pass its **entire contents** as the `text` of one
   `javascript_tool` call. It installs the panel and `window.__lmsAuto` and returns immediately.
4. Start it without awaiting:
   ```js
   window.__lmsAuto.start(80)   // returns 'started'
   ```
   The run takes about 5 seconds per lesson, which is several minutes per course. **Do not `await` the whole run**:
   `javascript_tool` times out after about 45 seconds.
5. Poll the status every 30 to 40 seconds. Keep each call well under 45 seconds:
   ```js
   await new Promise(r => setTimeout(r, 35000)); JSON.stringify(window.__lmsAuto.status())
   ```
   `status().state` is one of `running`, `target`, `finished`, `stopped` or `error`. Give the user a short update every
   few polls (for example "at 46%, Module 2").
6. When the state is no longer `running`, navigate to the course URL again and read the progress (step 2) to confirm
   the final number. Report how many lessons were marked, how many skipped, and any errors.

To stop early, run `window.__lmsAuto.stop()`.

## Known pitfalls

- **Full page reload:** this wipes the script. If `window.__lmsAuto` is `undefined` mid-run, inject the script again and
  call `start()` again. Lessons that are already complete are skipped.
- **Blocked tool output:** Claude in Chrome blocks results that contain URLs with query strings or cookie-like data. It
  shows `[BLOCKED: Cookie/query string data]`. Return only pathnames (`location.pathname`) or plain text, and strip `?...`
  from any href you return.
- **Lesson links:** `a[href*="/lessons/"]` also matches the course's **Content** tab (`/courses/<slug>/lessons`), which
  redirects to the resume lesson. The script already filters for `/lessons/<id>`. Keep that filter if you edit it.
- **Navigation:** "Mark Complete" saves progress and then opens the next lesson by itself. The script waits for the URL
  to change before continuing.
- **Quizzes:** these have no Mark Complete button and are skipped. Never attempt quizzes or assignments for the user.
- **Dialogs:** don't trigger `alert`, `confirm` or `prompt`. They freeze the browser extension.

## Page structure the script depends on

All of these are inside `<main>`. If the LMS changes them, update the helper functions at the top of
`lms-autocomplete.js`.

| Purpose | How it's found |
|---|---|
| Mark lesson done | `<button>` with text exactly `Mark Complete` |
| Lesson already done | `<button>` with text exactly `Continue` |
| Next lesson | `<button>` whose text starts with `Next` |
| Back to the course outline | element with text `Back to Course` |
| Lesson title | `main h1` |
| Progress (lesson page) | text `Course Progress <N>%` |
| Progress (course page) | text `<N>% Your Progress` |

## Editing the project

- Keep it as one plain JavaScript file with no dependencies, so users can paste it straight into the console.
- After changes, syntax-check it with
  `node -e "new Function(require('fs').readFileSync('lms-autocomplete.js','utf8'))"`.
- Test against a course whose progress is already at or above the target. The run should open the first lesson and
  stop straight away, which tests navigation without marking anything new.
