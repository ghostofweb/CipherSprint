import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`

* {
  box-sizing: border-box;
}

body {
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.textColor};
  margin: 0;
  padding: 0;
  transition: all 0.3s linear;
}

.canvas {
  display: grid;
  min-height: 100vh;
  grid-auto-flow: row;
  grid-template-rows: auto 1fr auto;
  gap: 0.5rem;
  padding: 2rem;
  width: 100vw;
  text-align: center;
  align-items: center;
}

.type-box {
  display: block;
  max-width: 2000px;
  height: 200px;
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
  transition: opacity 0.5s ease;
}

.type-box.resetting {
    opacity: 0;
}

.words {
  font-size: 50px;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  color: ${({ theme }) => theme.typeBoxColor}; // Consistent type color
}

.word {
  margin: 5px;
  padding-right: 2px;
}

.hidden-input {
  opacity: 0;
}

.correct {
  color: green;
}

.incorrect {
  color: red;
}

.extra {
  color: #6d3e3e; // Can also be themed if needed
}

.current {
    border-left: 1px solid ${({ theme }) => theme.textColor}; // Dynamic border color
    animation: blinkingLeft 1s infinite;
}

@keyframes blinkingLeft {
  0% { border-left-color: ${({ theme }) => theme.textColor}; }
  25% { border-left-color: black; }
  50% { border-left-color: ${({ theme }) => theme.textColor}; }
  75% { border-left-color: black; }
  100% { border-left-color: ${({ theme }) => theme.textColor}; }
}

.current-right {
    border-right: 1px solid ${({ theme }) => theme.textColor}; // Dynamic border color
    animation: blinkingRight 1s infinite;
}

@keyframes blinkingRight {
  0% { border-right-color: ${({ theme }) => theme.textColor}; }
  25% { border-right-color: black; }
  50% { border-right-color: ${({ theme }) => theme.textColor}; }
  75% { border-right-color: black; }
  100% { border-right-color: ${({ theme }) => theme.textColor}; }
}

.upper-menu {
  display: flex;
  width: 2000px;
  margin-left: auto;
  margin-right: auto;
  justify-content: space-between;
  font-size: 30px;
  padding: 0.5rem;
  color: ${({ theme }) => theme.textColor}; // Use theme text color
}

.modes {
  display: flex;
  gap: 0.4rem;
}

.time-mode:hover {
  color: green;
  cursor: pointer;
}
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  padding-left: 3rem; /* Increase left padding */
  max-width: 2000px;
  margin: 0 auto;
  color: ${({ theme }) => theme.textColor};
}



.footer-left {
  font-size: 0.9rem;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 2rem; /* Add margin to the left of the right section */
}

.footer-right a {
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.textColor};
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-right a:hover {
  color: #ccc;
}
.footer-right a img {
  fill: ${({ theme }) => theme.textColor}; /* Only if inline fill is removed */
  width: 24px; /* Set a fixed width */
  height: 24px; /* Set a fixed height */
}

.footer-icon {
  width: 24px;
  height: 24px;
  margin-right: 0.5rem;
}

.theme-select {
  min-width: 150px;
}

`;
