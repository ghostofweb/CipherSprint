// TestModeContext.jsx
import { createContext, useState, useContext } from "react";

const TestModeContext = createContext();

export const TestModeContextProvider = ({ children }) => {
    const [testTime, setTestTime] = useState(15);
    const [testType, setTestType] = useState("time"); // 'time' or 'words'
    const [wordCount, setWordCount] = useState(15); // For word mode, default 15

    const values = {
        testTime,
        setTestTime,
        testType,
        setTestType,
        wordCount,
        setWordCount,
    };

    return (
        <TestModeContext.Provider value={values}>
            {children}
        </TestModeContext.Provider>
    );
};

export const useTestMode = () => {
    return useContext(TestModeContext);
};
