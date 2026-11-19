# Exercise Timer

A simple, dependency-free interval timer for exercise sets, built with plain HTML, CSS and JavaScript.

## Features

- Configurable exercise duration, rest duration and number of reps
- Optional rest increment: rest time grows by a set amount after each rep (set to 0 for constant rest)
- 5-second get-ready countdown before the first rep
- Audio cues (Web Audio API) at the start of exercise and rest phases
- Start / pause / reset controls

## Usage

No build step or install required. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| Exercise duration | 5 s | Length of each exercise interval |
| Rest duration | 1 s | Initial rest between reps |
| Rest increment | 0.5 s | Added to rest after each rep |
| Number of reps | 11 | Total reps in the session |

## Files

- `index.html` – markup
- `style.css` – styles
- `app.js` – timer state machine and audio
