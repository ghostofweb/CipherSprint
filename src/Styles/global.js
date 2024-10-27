import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`

* {
  box-sizing: border-box;
}

body {
  background: black;
  color: white;
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
  max-width: 1000px;
  height: 175px;
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
}

.words {
  font-size: 32px;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
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

.current {
    border-left: 1px solid;
    animation: blinkingLeft 1s infinite;
}

@keyframes blinkingLeft {
  0% { border-left-color: white; }
  25% { border-left-color: black; }
  50% { border-left-color: white; }
  75% { border-left-color: black; }
  100% { border-left-color: white; }
}

.current-right {
    border-right: 1px solid;
    animation: blinkingRight 1s infinite;
}

@keyframes blinkingRight {
  0% { border-right-color: white; }
  25% { border-right-color: black; }
  50% { border-right-color: white; }
  75% { border-right-color: black; }
  100% { border-right-color: white; }
}

.upper-menu {
  display: flex;
  width: 1000px;
  margin-left: auto;
  margin-right: auto;
  justify-content: space-between;
  font-size: 1.35rem;
  padding: 0.5rem;
}

.modes {
  display: flex;
  gap: 0.4rem;
}
`;
