// UpperMenu.jsx
import React from 'react';
import { useTestMode } from '../Context/TestModeContext';

const UpperMenu = ({ countDown }) => {
    const { testTime, setTestTime, testType, setTestType, wordCount, setWordCount } = useTestMode();

    const updateTime = (e) => {
        setTestType("time");
        setTestTime(Number(e.target.id));
    };

    const updateWordCount = (e) => {
        setTestType("words");
        setWordCount(Number(e.target.id));
        // Start timing from 0 if the user selects word mode
        // Assuming you have a method to start the timer, call it here
        // startTimer(); // Uncomment and implement this function as needed
    };

    return (
        <div className='upper-menu'>
            <div className='counter'>{countDown || 15}</div>
            <div className="mode-labels">
                <div className="time-mode" onClick={() => setTestType("time")}>Time Mode</div>
                <span className="separator">|</span>
                <div className="word-mode" onClick={() => setTestType("words")}>Word Mode</div>
            </div>
            {testType === "time" ? (
                <div className="time-options">
                    <div className="time-option" id={15} onClick={updateTime}>15s</div>
                    <div className="time-option" id={30} onClick={updateTime}>30s</div>
                    <div className="time-option" id={60} onClick={updateTime}>60s</div>
                </div>
            ) : (
                <div className="word-options">
                    <div className="word-option" id={15} onClick={updateWordCount}>15 Words</div>
                    <div className="word-option" id={30} onClick={updateWordCount}>30 Words</div>
                    <div className="word-option" id={50} onClick={updateWordCount}>50 Words</div>
                </div>
            )}
        </div>
    );
};

export default UpperMenu;
