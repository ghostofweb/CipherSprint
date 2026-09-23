import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
* {
  box-sizing: border-box;
}

body {
    background: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 0;
    transition: background-color 0.3s linear, color 0.3s linear;
    font-family: var(--font-ui);
}

.canvas {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    gap: 64px;
    padding: 24px 32px;
    width: 100%;
    max-width: 1536px;
    margin: 0 auto;
}

.site-header {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: opacity 125ms ease-in-out;
}

.chrome-hidden {
    opacity: 0;
    pointer-events: none;
}

.mode-bar {
    transition: opacity 125ms ease-in-out;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-icons {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity 125ms ease-in-out;
}

/* The logo + wordmark are one control (a button), so the whole lockup is
   a click target back to the typing test. */
.brand {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0;
    color: var(--text);
    background: none;
    border: 0;
    font: inherit;
    cursor: pointer;
}

/* <main> wraps whatever a page renders, so its children keep the same
   vertical rhythm they had as direct children of the canvas. */
.page {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: 32px;
    min-width: 0;
}

.home-main {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
}

.route-loading {
    display: flex;
    justify-content: center;
    padding: 48px 0;
}

/* Phones: keep every header control on screen. The logo alone is the home
   link, the account shows just its avatar, and the page gutters tighten. */
@media (max-width: 640px) {
    .canvas {
        gap: 32px;
        padding: 16px;
    }

    .header-left {
        gap: 8px;
        min-width: 0;
    }

    .brand {
        gap: 0;
    }

    .header-icons {
        gap: 0;
    }

    .account-trigger span {
        display: none;
    }
}

.user-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--muted);
    transition: opacity 125ms ease-in-out;
}

.typing-test-shell {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.typing-test {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 24px;
    transition: opacity 125ms ease-in-out;
    opacity: 1;
}

.typing-test.fading {
    opacity: 0;
}

.type-box {
    position: relative;
    display: block;
    width: 100%;
    margin: 0 auto;
    overflow: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    user-select: none;
    pointer-events: auto;
    cursor: text;
}
.type-box::-webkit-scrollbar {
    display: none;
}

.words {
    position: relative;
    gap: 8px;
    line-height: 1.5;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    color: var(--word-color);
    transition: transform 125ms cubic-bezier(.42,0,.58,1), filter 0.3s ease;
}

.words.blurred {
    filter: blur(4px);
}

.focus-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--muted);
    font-size: 1rem;
    text-align: center;
    z-index: 2;
}

.word {
    position: relative;
    margin: 4px;
    padding-right: 2px;
    white-space: nowrap;
}

/* Zen mode has no spaces to break a "word" at, so a long unbroken run typed
   without pressing space would otherwise just keep extending sideways past
   the box and get clipped by its overflow:hidden. Let it wrap mid-word
   instead, so whatever is being typed stays visible. */
.zen-words .word {
    white-space: normal;
    word-break: break-all;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
}

.missed {
    opacity: 0.5;
    text-decoration: underline;
    text-decoration-color: var(--incorrect-color);
}

.correct {
  color: var(--correct-color);
}

.incorrect {
  color: var(--incorrect-color);
}

.extra {
  color: var(--incorrect-color);
  opacity: 0.7;
}

.caret {
    position: absolute;
    width: 2px;
    background: var(--caret-color);
    border-radius: 1px;
    opacity: 1;
    transition: left 100ms cubic-bezier(.42,0,.58,1), top 100ms cubic-bezier(.42,0,.58,1);
    pointer-events: none;
}

.caret.idle {
    animation: caretBlink 1s step-end infinite;
}

@keyframes caretBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.replay-container {
    display: flex;
    justify-content: center;
    transition: opacity 125ms ease-in-out;
}

/* Hidden while actively typing (chrome-hidden), but a keyboard user tabbing
   to it mid-test can still bring it back into view. */
.replay-container.chrome-hidden:focus-within {
    opacity: 1;
    pointer-events: auto;
}

.replay-container .ui-iconbtn {
    width: 40px;
    height: 40px;
}

.replay-container .ui-iconbtn:focus-visible {
    color: var(--text);
}

.results {
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
}

.results-main {
    display: flex;
    align-items: stretch;
    gap: 48px;
}

.results-primary {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 24px;
    flex: 0 0 auto;
}

.results-graph {
    flex: 1 1 auto;
    height: 260px;
    min-width: 0;
}

.results-secondary {
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
}

.stat-block {
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-size: 0.85rem;
    color: var(--muted);
}

.stat-value {
    font-size: 1.2rem;
    color: var(--text);
    font-variant-numeric: tabular-nums;
}

.stat-value.accent {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1.1;
    color: var(--caret-color);
}

.stat-sub {
    font-size: 0.75rem;
    color: var(--muted);
}

.results-toolbar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
}

.site-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--muted);
  transition: opacity 125ms ease-in-out;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-right a {
  display: flex;
  align-items: center;
  color: var(--muted);
  transition: color 0.15s ease;
}

.footer-right a:hover {
  color: var(--text);
}

/* Media Queries for Responsive Design */
@media (max-width: 1903px) {
    .words {
        --test-base: 1.6rem;
    }
}

@media (max-width: 1519px) {
    .words {
        --test-base: 1.4rem;
    }

    .site-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    .results-main {
        flex-direction: column;
    }
}

.theme-picker-trigger {
  cursor: pointer;
  background: transparent;
  color: var(--muted);
  border: none;
  font-family: "Roboto Mono", monospace;
  font-size: 0.75rem;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s ease;
}

.theme-picker-trigger:hover {
  color: var(--text);
}

.avatar-crop-area {
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(128, 128, 128, 0.1);
}

.avatar-crop-zoom {
  width: 100%;
  accent-color: var(--text);
}

`;
