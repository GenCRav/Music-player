# 🎵 Music Player

A fully client-side, browser-based music player built with pure HTML, CSS, and JavaScript. Just open the file and play your music.

---

## Project Description

Music Player is a feature-rich local music player that runs entirely in the browser. It reads MP3 files directly from the user's device, extracts metadata (title, artist, genre, album art) using the ID3 standard, and provides a clean three-panel interface for managing and playing a personal music library.

The project was designed with a focus on usability, performance, and offline capability. All audio processing and metadata extraction happens on the client side, meaning no files are ever uploaded to a server your music stays private on your machine.

---

## How to Run the Application

### Open directly (recommended)
1. Double-click the file to open it in your browser(index.html)
2. Click **Load** or drag and drop MP3 files onto the window
3. Press Play




### Supported browsers
| Browser     |Support|
|------------=|-------|
| Chrome 90+  |  Full |
| Edge 90+    |  Full |
| Firefox 90+ |  Full |
| Safari 15+  |  Full |

---

## Features Implemented

### Core Playback
- ▶️ Play / Pause / Previous / Next track controls
- 🔀 Shuffle mode with Fisher-Yates randomized queue
- 🔁 Repeat modes: Off → Repeat All → Repeat One
- 🔊 Volume control with mute toggle
- ⏩ Seekable progress bar (click or drag)
- ⌨️ Full keyboard shortcuts (Space, Arrow keys, M, S, R, F)

### Metadata Detection
- **Title** — reads ID3 tag, falls back to filename parsing, then bare filename
- **Artist** — reads ID3 tag, falls back to `"Artist - Title"` filename patterns (supports `-`, `–`, `—`), feat. extraction, bracket patterns
- **Genre** — reads and cleans ID3 genre tag (including numeric ID3v1 codes like `(17)` → `"Rock"`), falls back to keyword scan across 40+ genre categories with hundreds of artist name keywords
- **Album Art** — extracts embedded art from ID3 tags, or matches sidecar image files by filename, or uses a folder cover image (`cover.jpg`, `folder.jpg`, etc.)

### Library Management
- 📁 **Album Folders** — create named, color-tagged folders; right-click any track to add it to a folder; click a folder to filter the song list
- ❤️ **Favorites** — heart any track to save it; appears in the Favorites panel; persists across sessions
- 🕐 **Recently Played** — automatically tracks the last 20 played tracks with relative timestamps ("just now", "5m ago", etc.)
- 🔍 **Search** — real-time search across title, artist, album, and genre
- 🗂️ **Sort** — sort All Songs by Title, Artist, or Genre

### UI & Experience
- 🌙 **Dark / Light mode** — toggle with the moon/sun button; preference saved to localStorage
- 🖱️ **Drag & Drop** — drag MP3 or image files directly onto the window to load them
- 📱 **Responsive layout** — 3-column on desktop, 2-column on tablet, single column on mobile
- 🎨 **Genre tags** — displayed as pill badges on each track row and in the now-playing bar
- 💾 **Session persistence** — playlist metadata, favorites, folders, sort state, volume, and theme all saved to localStorage

---

## Known Limitations or Bugs

| Limitation | Details |
|------------|---------|
| **Blob URL expiry** | Audio blob URLs (`blob://`) are created in-memory and die when the tab is closed or refreshed. The app detects ghost tracks on reload and clears them, prompting the user to re-load files. |
| **No folder resume** | There is no File System Access API folder-picker integration, so sessions cannot automatically reload files. Users must re-drag or re-select files after a page refresh. |
| **Genre detection gaps** | Niche or indie artists not in the keyword list (e.g. game OST composers like Casey Edwards) will show no genre unless the MP3 has an embedded ID3 genre tag. |
| **Single-file limit** | The player is a single HTML file. The separate `style.css` and `app.js` versions require a local server to work — they cannot be opened directly via `file://` due to browser CORS restrictions. |
| **No playlist export** | There is currently no way to export or import a playlist. Favorites and folders are saved in localStorage only. |
| **Safari blob audio** | Some versions of Safari have inconsistent behavior with blob URL audio sources. Chrome or Edge is recommended. |
| **Large libraries** | Loading 500+ tracks at once may cause a slight delay during ID3 parsing, since parsing is done sequentially in a for-await loop. |

---

## Design Decisions and HCI Principles Applied

### Design System
- **Typography** — `Space Mono` (monospace, used for labels, metadata, timestamps, sort pills) paired with `DM Sans` (humanist sans-serif, used for track titles and body). The contrast between display and mono creates a clear visual hierarchy.
- **Color tokens** — all colors defined as CSS custom properties (`--text`, `--surface`, `--accent`, etc.) making dark/light theme switching a single attribute swap on `<html>`.
- **Spacing** — consistent 4px base unit throughout; track rows use 5–10px padding, panel headers use 12–14px.

### HCI Principles Applied

**1. Visibility of System Status (Nielsen Heuristic #1)**
The animated equalizer bars on the currently playing track row give immediate visual feedback that audio is playing. The track title, artist, genre tag, and album art all update in the bottom player bar when a new track loads.

**2. Match Between System and Real World (Nielsen Heuristic #2)**
Familiar music player iconography (play triangle, skip arrows, shuffle/repeat icons) is used throughout. The heart icon for favorites and the clock icon for recently played match users' mental models from Spotify and Apple Music.

**3. User Control and Freedom (Nielsen Heuristic #3)**
Users can clear the playlist, delete folders, remove favorites, cancel the folder creation modal, and undo shuffle/repeat at any point. The confirm dialog before clearing the playlist prevents accidental data loss.

**4. Recognition Rather Than Recall (Nielsen Heuristic #6)**
The folder filter bar shows an active chip when a folder is selected, so users always know they're looking at a filtered view. The sort pill stays highlighted to show the current sort mode. Genre tags are shown inline on each track so users don't have to remember what they tagged.

**5. Aesthetic and Minimalist Design (Nielsen Heuristic #8)**
The interface uses a restrained black-and-white palette with a single accent color (the heart red). Genre tags and sort pills use lightweight pill badges to convey information without clutter. Empty states use subtle icons with brief instructional text.

**6. Flexibility and Efficiency of Use (Nielsen Heuristic #7)**
Power users can use full keyboard shortcuts (Space to play/pause, arrow keys to seek and change volume, S for shuffle, R for repeat, F to favorite). Mouse users have drag-and-drop. Touch users have tap targets sized to 32px minimum.

### Wireframe-to-Implementation
The layout was designed from a hand-drawn wireframe showing three panels (Favorites | All Songs | Recently Played) with a fixed bottom player bar — a layout pattern borrowed from desktop DAWs and media players. The wireframe informed the grid structure: `minmax(210px, 270px) minmax(0, 1fr) minmax(210px, 270px)`, which collapses gracefully at smaller viewports.

### Persona Considerations
The design targets two primary personas:

- **Casual listener** — wants to drag in a folder of MP3s and press play immediately. The auto-detect of title, artist, and genre from ID3 tags and filenames removes any manual setup step.
- **Organized collector** — wants to sort, filter, and categorize their library. Album Folders with color tags, sort pills, and the search bar serve this persona's need for structure without imposing it on the casual listener.

---

## Link to Design Documentation

| Document | Description |
|----------|-------------|
| `index.html` | Main HTML structure (semantic layout, ARIA roles, accessibility attributes) |
| `style.css` | Full design system — CSS variables, light/dark theme tokens, component styles, responsive breakpoints |
| `script.js` | Application logic — ID3 parsing, genre detection engine (40+ categories), filename parser, render functions, persistence layer |

### Design System Reference

```
Fonts:
  Display / UI labels  →  Space Mono (400, 700)
  Body / track titles  →  DM Sans (400, 500, 600, 700, 800)

Light Theme Palette:
  Background     #f2f2f2   Surface      #cfc6c6
  Border         #111111   Border thin  #cccccc
  Text           #111111   Text muted   #555555
  Accent         #111111   Heart        #cc1111
  Playing bg     #837f7f   Player bar   #555555

Dark Theme Palette:
  Background     #252525   Surface      #1e1e1e
  Border         #00eeff93 Border thin  #333333
  Text           #eeeeee   Text muted   #aaaaaa
  Accent         #eeeeee   Heart        #e63030
  Playing bg     #082c3df6 Player bar   #1a1a1a

Border radius: 4px
Border width:  2px
Transition:    120–200ms ease
```

---

## File Structure

```
music player/
├── index.html       ← HTML structure (links to style.css + script.js)
├── style.css        ← All styles and theme tokens
├── script.js        ← All JavaScript logic
├── README.md        ← Project documentation (this file)
└── assets/
    ├── audio/      ← MP3 files (user-provided)
    │   └── Artist - Title (Genre).mp3
    └── images/     ← Album art (user-provided)
        └── Artist - Title (Genre).jpg
```
```

---

## Dependencies

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| jsmediatags | 3.9.7 | Read ID3 metadata tags from MP3 files | cdnjs.cloudflare.com |
| Space Mono | — | Monospace display font | Google Fonts |
| DM Sans | — | Body/UI sans-serif font | Google Fonts |

No build tools, no npm, no bundler. Open the HTML file and it works.

---

*Music Player — built with HTML, CSS, and JavaScript.*
