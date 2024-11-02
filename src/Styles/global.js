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
  font-style: normal;
}

.canvas {
  display: grid;
  min-height: 100vh;
  grid-auto-flow: row;
  grid-template-rows: auto 1fr auto;
  gap: 0.5rem;
  padding: 2rem;
  width: 80vw; /* Set to 70% of viewport width */
  max-width: 2000px; /* Optional max width */
  text-align: center;
  align-items: center;
  margin: 0 auto; /* Center the canvas horizontally */
}

.type-box {
    display: block;
    max-width: 2000px;
    height: 240px;
    margin-left: auto;
    margin-right: auto;
    overflow-y: scroll; /* Use scroll to maintain scroll functionality */
    scrollbar-width: none; /* For Firefox */
    -ms-overflow-style: none; /* For Internet Explorer and Edge */
    transition: opacity 0.5s ease; /* Smooth transition for opacity */
}

.type-box::-webkit-scrollbar {
    display: none; 
}



.type-box.resetting {
    opacity: 0;
}

.words {
    font-size: 38px;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    color: ${({ theme }) => theme.wordColor}; 
    transition: transform 0.3s ease; 
}

.word {
  margin: 5px;
  padding-right: 2px;
}
.untyped {
    opacity: 0.5; /* Example styling for untyped words */
}

.hidden-input {
  opacity: 0;
}

.correct {
  color: ${({ theme }) => theme.correctWordColor}; 
}

.incorrect {
  color: ${({ theme }) => theme.incorrectWordColor}; 
}
.extra {
  color: #6d3e3e; // Can also be themed if needed
}
.current {
    border-left: 1px solid ${({ theme }) => theme.textColor};
    animation: blinkingLeft 1s infinite;
    transition: border-color 0.3s; /* Smooth transition for cursor color */
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
  width: 100%; /* Allow it to stretch the full width */
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

.replay-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}

.replay-container .MuiSvgIcon-root {
    font-size: 2rem; /* Adjust the size of the replay icon */
}
.type-box.resetting {
    opacity: 0;
    transition: opacity 0.5s ease; /* Smooth transition for opacity */
}

.results {
    opacity: 0;
    transition: opacity 0.5s ease; /* Smooth transition for opacity */
}

.results.fade-in {
    opacity: 1;
}

.results.fade-out {
    opacity: 0;
}


.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  padding-left: 3rem; /* Increase left padding */
  width: 80vw; /* Set to 70% of viewport width */
  max-width: 2000px; /* Optional max width */
  margin: 0 auto; /* Center the footer horizontally */
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

.stats-box {
  display: flex;
  width: 100%;
  max-width: 2000px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem; /* Optional gap between left and right sections */
}

.left-stats {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.right-stats {
  flex: 2;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.title{
  font-size: 20px;
  color: ${({theme})=>theme.typeBoxColor}
}

.subtitle{
  font-size: 30px;
}

.header{
  width: 1500px;
  display: flex;
  justify-content: space-between;
  margin-left:auto;
  margin-right: auto;
}

.user-profile {
  display: flex;
  justify-content: space-between; /* Space between user info and total results */
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}

.user {
  display: flex;
  align-items: center;
}

.picture {
  margin-right: 15px;
}

.email {
  font-size: 1.5rem; /* Increased size for email */
  font-weight: bold;
  color: inherit; /* Inherit color from the parent */
}

.joined-at {
  font-size: 0.9rem;
  color: gray; /* You can modify based on theme */
}

.total-results {
  font-size: 1.2rem; /* Size similar to 'Total Test Taken' */
  font-weight: bold;
  color: inherit; /* Inherit color from the parent */
}
.user-profile{
  background: black;
}

.logo g{
  fill: ${({ theme }) => theme.textColor}
}
.logo path{
  stroke: ${({ theme }) => theme.textColor};
  stroke-width: 10px;
}

.logo-section {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo {
  width: 40px; /* Set the desired width */
  height: 40px; /* Set the desired height */
}
`;
