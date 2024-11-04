import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap');

* {
  box-sizing: border-box;
}

body {
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.textColor};
    margin: 0;
    padding: 0;
    transition: all 0.3s linear;
    font-family: "Roboto Mono", monospace;
}

.canvas {
    display: grid;
    min-height: 100vh;
    grid-auto-flow: row;
    grid-template-rows: auto 1fr auto;
    gap: 1rem;
    padding: 1.5rem;
    width: 95vw;
    max-width: 90%;
    text-align: center;
    align-items: center;
    margin: 0 auto;
}

.type-box {
    display: block;
    width: 100%;
    max-width: 95%;
    height: 30vh;
    margin: 0 auto;
    overflow-y: scroll;
    scrollbar-width: none; 
    -ms-overflow-style: none; 
    transition: opacity 0.5s ease; 
    user-select: none;           
}
.type-box::-webkit-scrollbar {
    display: none;
}

.words {
    gap: 10px;
    font-size: 1.8rem;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    color: ${({ theme }) => theme.wordColor}; 
    transition: transform 0.3s ease, filter 0.3s ease;
}

.words.blurred {
    filter: blur(4px);
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
    margin: 4px;
    padding-right: 2px;
    white-space: nowrap; 
}

.hidden-input {
  opacity: 0;
}

.untyped {
    opacity: 0.5;
    text-decoration: line-through;
}

.correct {
  color: ${({ theme }) => theme.correctWordColor}; 
}

.incorrect {
  color: ${({ theme }) => theme.incorrectWordColor}; 
}

.extra {
  color: #6d3e3e;
}

.current {
    border-left: 1px solid ${({ theme }) => theme.cursorColor};
    animation: blinkingLeft 1s infinite;
    transition: border-color 0.3s;
}

@keyframes blinkingLeft {
  0%, 100% { border-left-color: ${({ theme }) => theme.cursorColor}; }
  25%, 75% { border-left-color: black; }
}

.upper-menu {
  display: flex;
  width: 100%;
  justify-content: space-between;
  font-size: 1.5rem; 
  padding: 0.5rem;
  color: ${({ theme }) => theme.textColor};
}

.modes {
  display: flex;
  gap: 0.4rem;
}

.time-mode:hover {
  color: green;
  cursor: pointer
}

.replay-container {
    display: flex;
    justify-content: center;
    margin-top: 15px;
}

.replay-container .MuiSvgIcon-root {
    font-size: 1.8rem;
}

.results {
    opacity: 0;
    transition: opacity 0.5s ease;
}

.results.fade-in {
    opacity: 1;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  width: 90vw; 
  max-width: 90%;
  margin: 0 auto;
  color: ${({ theme }) => theme.textColor};
}

.footer-left {
  font-size: 0.8rem;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.footer-right a {
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.textColor};
  text-decoration: none;
  transition: color 0.3s ease;
  
}

.footer-right a img {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.stats-box {
  display: flex;
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  gap: 1.5rem;
}

.left-stats, .right-stats {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: 200px; 
}

.left-stats {
  width: 50%; 
}

.right-stats {
  width: 50%; 
}

.title {
  font-size: 1.4rem;
  color: ${({ theme }) => theme.typeBoxColor};
}

.subtitle {
  font-size: 2rem;
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
  fill: ${({ theme }) => theme.textColor}; /* This controls the fill color */
  stroke: ${({ theme }) => theme.textColor}; /* If you need stroke as well */
  stroke-width: 1px; /* Set stroke-width if needed */
}

.logo-section {
  display: flex;
  align-items: center;
  cursor: pointer;
}


/* Media Queries for Responsive Design */
@media (max-width: 1903px) {
    .type-box {
        height: 200px; /* Slightly reduce height on smaller screens */
    }
    .words {
        font-size: 1.6rem; /* Reduce font size */
    }
    .upper-menu {
        font-size: 1.3rem; /* Reduce font size */
    }
    .not-typed {
    color: gray; /* Or any other styling you prefer */
    text-decoration: line-through; /* Optional: to show that these characters were not typed */
}

}

@media (max-width: 1519px) {
    .type-box {
        height: 180px; /* Further reduce height on even smaller screens */
    }
    .words {
        font-size: 1.4rem; /* Further reduce font size */
    }
    .upper-menu {
        flex-direction: column; /* Stack elements vertically */
        font-size: 1.1rem; /* Reduce font size */
    }
.not-typed {
    color: gray; /* Or any other styling you prefer */
    text-decoration: line-through; /* Optional: to show that these characters were not typed */
}


    .footer {
        flex-direction: column; /* Stack footer elements vertically */
        align-items: flex-start; /* Align footer items to the start */
    }
    .stats-box {
        flex-direction: column; /* Stack stats vertically */
    }
    .left-stats, .right-stats {
        width: 100%; /* Make stats take full width */
    }
}

.icon{
  height: 40px;
  width: 40px;
}
`;

