import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { TestModeContextProvider } from './Context/TestModeContext.jsx';
import { ThemeContextProvider } from './Context/ThemeContext.jsx';
import { BrowserRouter } from 'react-router-dom';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ThemeContextProvider>
    <TestModeContextProvider>
      <BrowserRouter>
    <App />
    </BrowserRouter>
    </TestModeContextProvider>
    </ThemeContextProvider>
);
