# BMSCE LMS Auto-Complete

> Mark lessons complete on [lms.bmsce.in](https://lms.bmsce.in) automatically, up to the course-progress percentage
> you choose.

![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![No install](https://img.shields.io/badge/install-none-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

This is a single script that you paste into your browser console. It adds a small control panel to the LMS page,
goes through the course lesson by lesson, clicks **Mark Complete**, and stops when the course progress reaches your
target.

---

## Features

- 🎯 **Target percentage:** choose how far to go, such as 50%, 75%, 80% or 100%, or any number you type.
- 📊 **Live panel:** a progress bar with a target marker, the current status, and Start and Stop buttons.
- 📝 **Logging:** a colour-coded log in the panel and the console. **Save log** downloads it as a `.log` file.
- 🔁 **Safe to re-run:** lessons that are already complete are skipped.
- 🧭 **Picks up where you left off:** it jumps straight to your first unfinished lesson. If it reaches the end with lessons still open earlier in the course (for example newly added ones), it goes back for them.
- 🐢 **Polite:** it waits between actions so it doesn't hammer the server.
- 📦 **Zero setup:** no extensions, installs or accounts. Paste the script and go.
- 🤖 **Works with Claude:** includes a [`CLAUDE.md`](CLAUDE.md) so Claude (with Claude in Chrome) can run it for you.

## Quick start

1. Log in to **https://lms.bmsce.in** and open the course you want to complete.
2. Open DevTools with **F12** (or **Ctrl+Shift+J**, or **Cmd+Option+J** on a Mac) and go to the **Console** tab.
3. Open [`lms-autocomplete.js`](lms-autocomplete.js), click **Raw**, copy everything, paste it into the console and
   press **Enter**.
   > If Chrome says pasting is blocked, type `allow pasting`, press Enter, and paste again.
4. In the panel in the bottom-right corner, enter a target (for example `80`) and press **Start**.
5. Leave the tab open until the panel shows **Target reached ✓**.

```
┌─ BMSCE LMS Auto-Complete ─────────── ✕ ┐
│ Complete the course up to:             │
│ [ 80 ] %   (50) (75) (80) (100)        │
│ ███████████████░░░░░░░|░░░░            │
│ Progress: 62% → target 80%   Running…  │
│ [ Start ] [ Stop ] [ Save log ]        │
│ 10:47:13 OK   Marked complete: …       │
│ 10:47:16 OK   Marked complete: …       │
└────────────────────────────────────────┘
```

## Let Claude run it

If you use [Claude Code](https://claude.com/claude-code) or the Claude desktop app with **Claude in Chrome**, clone
this repo and ask:

> Run the BMSCE LMS auto-complete on https://lms.bmsce.in/courses/your-course up to 80%.

Claude reads [`CLAUDE.md`](CLAUDE.md), injects the script into your logged-in tab, starts it, checks on it until it
finishes, and reports the final progress.

## How it works

On each lesson page:

| The page shows | The script |
|---|---|
| **Mark Complete** | clicks it. The LMS saves progress and opens the next lesson. |
| **Continue** or **Course Complete** (already done) | logs `SKIP` and clicks **Next**. |
| Neither (for example a quiz) | logs `SKIP` and clicks **Next**. |
| No **Next** button | stops, because it has reached the end of the course. |

Before every lesson it reads the LMS's own **Course Progress %**, and it stops as soon as that reaches your target.

### Console API

After the script is pasted, you can also control it from the console:

```js
__lmsAuto.start(75)     // start with a 75% target
__lmsAuto.status()      // { state, progress, target, stats, lastLines }
__lmsAuto.stop()        // stop after the current lesson
__lmsAuto.downloadLog() // save the log file
```

## Logging

- **In the panel and console:** each step is shown with a time and a level: `OK`, `SKIP`, `ERR` or `INFO`.
- **Saved file:** **Save log** writes a tab-separated file with these columns:

  ```
  time  level  progress%  message  page
  ```

## Troubleshooting

| Problem | Fix |
|---|---|
| Nothing happens after pasting | Make sure you're on an `lms.bmsce.in/courses/...` page and logged in. |
| "Could not find a lesson link" | Open the course's overview page and press Start again. |
| The run stopped partway | The page probably reloaded. Paste the script again and press Start; completed lessons are skipped. |
| "Mark Complete had no effect" | The LMS may need you to watch part of that lesson first. Do it manually and re-run. |
| The panel disappeared | Paste the script again. |

## Limitations

- Quizzes and assignments are **never** attempted.
- The script relies on the LMS's current button labels (`Mark Complete`, `Continue`, `Next`). If the site changes, it
  may need an update. See the selector table in [`CLAUDE.md`](CLAUDE.md).
- It only runs while the tab is open.

## Disclaimer

This is an unofficial personal tool and isn't affiliated with BMSCE. Use it on your own account and at your own
discretion. Marking a lesson complete doesn't mean you learned it, so watch the lectures. 🙂

## License

[MIT](LICENSE)
