import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { TestModeContextProvider } from './Context/TestModeContext.jsx';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TestModeContextProvider>
    <App />
    </TestModeContextProvider>
  </React.StrictMode>
);
