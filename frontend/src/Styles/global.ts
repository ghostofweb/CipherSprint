import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap');

* {
  box-sizing: border-box;
}

body {
    background: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 0;
    transition: background-color 0.3s linear, color 0.3s linear;
    font-family: "Roboto Mono", monospace;
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

.brand-logo {
    width: 52px;
    height: 52px;
}

.brand-logo path {
    fill: var(--text);
    stroke: var(--text);
}

.brand-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
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

    .brand-logo {
        width: 40px;
        height: 40px;
    }

    .brand-name {
        display: none;
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

.test-timer {
    font-size: 2rem;
    font-weight: 600;
    color: var(--text);
    font-variant-numeric: tabular-nums;
    text-align: left;
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
    font-size: 1.85rem;
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

.prompt {
    display: flex;
    justify-content: center;
    align-items: center;
    color: gray;
    font-size: 1.2em;
    cursor: pointer;
    margin-top: 10px;
    transition: opacity 0.3s ease;
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

.upper-menu {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  gap: 16px;
  font-size: 0.85rem;
  color: var(--muted);
}

/* Middle column is content-sized and flanked by two equal 1fr tracks, so it
   stays perfectly centered no matter what (if anything) is in the side
   columns — fixes the old flex layout visibly shifting between modes. */
.upper-menu-left {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
}

.upper-menu-center {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.upper-menu-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.mode-tab, .modifier-toggle, .time-option, .word-option, .quote-option {
  cursor: pointer;
  padding: 3px 10px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  transition: color 0.15s ease, border-color 0.15s ease;
  white-space: nowrap;
}

.mode-tab:hover, .mode-tab.active,
.modifier-toggle:hover, .modifier-toggle.active,
.time-option:hover, .time-option.active,
.word-option:hover, .word-option.active,
.quote-option:hover, .quote-option.active {
  color: var(--text);
  border-color: var(--text);
}

.mode-tab.active {
  font-weight: 600;
}

.mode-tab-edit {
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--muted);
  text-decoration: underline;
}

.mode-tab-edit:hover {
  opacity: 1;
}

.time-options, .word-options, .quote-options {
  display: flex;
  gap: 16px;
}

/* Media Queries for Responsive Design */
@media (max-width: 768px) {
  .upper-menu {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .upper-menu-left, .upper-menu-center, .upper-menu-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .upper-menu-right {
    justify-content: flex-start;
  }
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

.header {
  width: 100%;
  max-width: 1400px;
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
}

.user-profile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}

.email {
  font-size: 1.2rem;
  font-weight: bold;
  color: inherit;
}

.total-results {
  font-size: 1rem;
  font-weight: bold;
  color: inherit;
}

.logo {
  width: 36px;
  height: 36px;
}

.logo path {
  fill: ${(props: any) => props.theme.textColor}; /* This controls the fill color */
  stroke: ${(props: any) => props.theme.textColor}; /* If you need stroke as well */
  stroke-width: 1px; /* Set stroke-width if needed */
}

.logo-section {
  display: flex;
  align-items: center;
  cursor: pointer;
}


/* Media Queries for Responsive Design */
@media (max-width: 1903px) {
    .words {
        font-size: 1.6rem;
    }
}

@media (max-width: 1519px) {
    .words {
        font-size: 1.4rem;
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

.icon{
  height: 40px;
  width: 40px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  max-height: 55vh;
  overflow-y: auto;
  padding: 4px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 6px;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.theme-card:hover {
  transform: translateY(-2px);
}

.theme-card.selected {
  border-width: 2px;
}

.theme-preview-strip {
  position: relative;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 0.85rem;
  font-family: "Roboto Mono", monospace;
  overflow: hidden;
}

.theme-preview-caret {
  position: absolute;
  bottom: 8px;
  right: 10px;
  width: 18px;
  height: 3px;
  border-radius: 2px;
}

.theme-card-label {
  font-size: 0.8rem;
  color: var(--text);
  text-align: center;
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

.analytics-canvas {
  gap: 32px;
  padding-bottom: 48px;
}

.analytics-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.analytics-empty {
  color: var(--muted);
  font-size: 0.9rem;
  padding: 24px 0;
}

.analytics-empty.small {
  padding: 8px 0;
}

.analytics-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 24px;
}

.analytics-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analytics-section-title {
  font-size: 0.85rem;
  color: var(--muted);
  text-transform: lowercase;
}

.analytics-graph {
  height: 260px;
  width: 100%;
}

.analytics-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

@media (max-width: 768px) {
  .analytics-columns {
    grid-template-columns: 1fr;
  }
}

.analytics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.analytics-table th {
  text-align: left;
  color: var(--muted);
  font-weight: 400;
  padding: 6px 12px 6px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.25);
}

.analytics-table td {
  padding: 6px 12px 6px 0;
  color: var(--text);
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}

.activity-calendar {
  display: flex;
  gap: 3px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.activity-week {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.activity-day {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  background: rgba(128, 128, 128, 0.15);
}

.activity-day.level-1 { background: var(--caret-color); opacity: 0.3; }
.activity-day.level-2 { background: var(--caret-color); opacity: 0.5; }
.activity-day.level-3 { background: var(--caret-color); opacity: 0.75; }
.activity-day.level-4 { background: var(--caret-color); opacity: 1; }

.problem-keys {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.problem-key-row {
  display: grid;
  grid-template-columns: 48px 1fr 32px;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
}

.problem-key-label {
  color: var(--text);
  font-weight: 600;
  text-align: center;
}

.problem-key-bar-track {
  height: 8px;
  background: rgba(128, 128, 128, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.problem-key-bar {
  height: 100%;
  background: var(--incorrect-color);
  border-radius: 4px;
}

.problem-key-count {
  color: var(--muted);
  text-align: right;
}

.pb-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pb-group-title {
  font-size: 0.85rem;
  color: var(--muted);
  text-transform: lowercase;
  margin-bottom: 8px;
}

.pb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.pb-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 6px;
}

.pb-card-detail {
  font-size: 0.75rem;
  color: var(--muted);
}

.pb-card-wpm {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--caret-color);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.pb-card-sub {
  font-size: 0.75rem;
  color: var(--muted);
}

`;
