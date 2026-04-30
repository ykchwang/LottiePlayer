# Lottie JSON Viewer

A Chrome extension for previewing Lottie JSON animations directly in your browser — no external tools required.

---

## Features

- **Upload** — click the upload area, drag & drop, or use the Choose Files button
- **Multiple files** — load several animations at once and navigate between them with arrow buttons and dot indicators
- **Real Lottie rendering** — uses the official Lottie Web library for accurate playback
- **Playback controls** — play/pause toggle, reset, and a timeline scrubber
- **Loop toggle** — switch looping on or off
- **Background switcher** — toggle between white (`#ffffff`) and dark (`#121212`) canvas backgrounds
- **File info** — displays filename, file size, and detected animation type
- **Error handling** — shows a clear error if the uploaded JSON is not a valid Lottie file

---

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder
5. The extension icon will appear in your toolbar

---

## Usage

1. Click the extension icon to open the viewer
2. Upload a Lottie `.json` file by clicking, dragging, or using the Choose Files button
3. Use the playback controls to preview the animation
4. Upload additional files to compare — use the arrows or dots to switch between them

---

## Project Structure

```
├── popup.html          # Extension popup UI
├── popup.js            # All UI logic and animation controller
├── lottie.min.js       # Lottie Web renderer
├── manifest.json       # Chrome Extension Manifest v3
├── Assets/
│   ├── folder.svg
│   ├── play.svg
│   ├── pause.svg
│   └── repeat.svg
└── icon.png
```

---

## Tech

- **Manifest V3** Chrome Extension
- **Lottie Web** for SVG-based animation rendering
- Vanilla HTML, CSS, and JavaScript — no build step required
