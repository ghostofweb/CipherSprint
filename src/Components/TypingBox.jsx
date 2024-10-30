import { generate } from "random-words";
import UpperMenu from './UpperMenu.jsx';
import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { useTestMode } from "../Context/TestModeContext.jsx";

function TypingBox() {
    const inputRef = useRef(null);
    const { testTime } = useTestMode();
    const [wordsArray, setWordsArray] = useState(() => generate(100));
    const [intervalId,setInteralId] = useState(null)
    const [countDown, setCountDown] = useState(testTime);
    const [testStart, setTestStart] = useState(false);
    const [testEnd, setTestEnd] = useState(false);
    const [currWordIndex, setCurrWordIndex] = useState(0);
    const [currCharIndex, setCurrCharIndex] = useState(0);

    const wordsSpanRef = useMemo(() => {
        return Array(wordsArray.length).fill(0).map(() => createRef(null));
    }, [wordsArray]);

    const startTimer = () => {
        const intervalId = setInterval(() => {
            setInteralId(intervalId)
            setCountDown((prevCount) => {
                if (prevCount === 1) {
                    setTestEnd(true);
                    clearInterval(intervalId);
                    return 0;
                }
                return prevCount - 1;
            });
        }, 1000);
    };

    const resetTest = ()=>{
        clearInterval(intervalId)
        setCountDown(testTime)
        setCurrWordIndex(0)
        setCurrCharIndex(0)
        setTestStart(false);
        setTestEnd(false);
        setWordsArray(generate(100)) 
        resetWordSpanRefClassname();
        focusInput()
    }

    const resetWordSpanRefClassname = () => {
        wordsSpanRef.forEach((wordRef) => {
            if (wordRef.current) {
                // Clear all child spans and only keep original characters
                const originalChars = Array.from(wordRef.current.childNodes).slice(0, wordRef.current.dataset.wordLength);
                
                // Remove any extra characters
                while (wordRef.current.lastChild && wordRef.current.childNodes.length > originalChars.length) {
                    wordRef.current.removeChild(wordRef.current.lastChild);
                }
    
                // Reset class names for original spans
                originalChars.forEach((child) => {
                    child.className = "";
                });
            }
        });
        // Set the first character of the first word as current
        wordsSpanRef[0]?.current?.childNodes[0]?.classList.add("current");
    };
    
    

    const handleUserInput = (e) => {
        if (!testStart) {
            setTestStart(true);
            startTimer();
        }

        const allCurrChars = wordsSpanRef[currWordIndex]?.current?.childNodes;
        if (!allCurrChars) return;

        if (e.key === " ") {
            e.preventDefault();
            if (currCharIndex < allCurrChars.length) {
                allCurrChars[currCharIndex].classList.remove('current');
            } else {
                allCurrChars[currCharIndex - 1].classList.remove('current-right');
            }
            setCurrWordIndex(currWordIndex + 1);
            setCurrCharIndex(0);

            const nextWordChars = wordsSpanRef[currWordIndex + 1]?.current?.childNodes;
            if (nextWordChars && nextWordChars.length > 0) {
                nextWordChars[0].className = 'current';
            }
            return;
        }

        if (e.keyCode === 8) {
            if (currCharIndex !== 0) {
                if (allCurrChars.length === currCharIndex) {
                    if (allCurrChars[currCharIndex - 1].className.includes('extra')) {
                        allCurrChars[currCharIndex - 1].remove();
                        allCurrChars[currCharIndex - 2].className += " current-right";
                    } else {
                        allCurrChars[currCharIndex - 1].className = 'current';
                    }
                    setCurrCharIndex(currCharIndex - 1);
                    return;
                }
                allCurrChars[currCharIndex].className = ' ';
                allCurrChars[currCharIndex - 1].className = 'current';
                setCurrCharIndex(currCharIndex - 1);
            }
            return;
        }

        if (currCharIndex === allCurrChars.length) {
            let newSpan = document.createElement("span");
            newSpan.innerText = e.key;
            newSpan.className = 'incorrect extra current-right';
            allCurrChars[currCharIndex - 1].classList.remove("current-right");
            wordsSpanRef[currWordIndex].current.append(newSpan);
            setCurrCharIndex(currCharIndex + 1);
            return;
        }

        if (currCharIndex < allCurrChars.length) {
            if (e.key === allCurrChars[currCharIndex].innerText) {
                allCurrChars[currCharIndex].className = 'correct';
            } else {
                allCurrChars[currCharIndex].className = 'incorrect';
            }

            if (currCharIndex + 1 === allCurrChars.length) {
                allCurrChars[currCharIndex].className += ' current-right';
            } else {
                allCurrChars[currCharIndex + 1].className = 'current';
            }

            setCurrCharIndex(currCharIndex + 1);
        }
    };

    function focusInput() { 
        inputRef.current.focus();
    }

    useEffect(() => {
        resetTest()
    }, [testTime]);

    useEffect(() => {
        focusInput();
        wordsSpanRef[0].current.childNodes[0].className = "current";
    }, []);

    return (
        <div>
            <UpperMenu countDown={countDown} />
            {testEnd ? (
                <h1>Test Over</h1>
            ) : (
                <div className="type-box" onClick={focusInput}>
                    <div className='words'>
                    {wordsArray.map((word, index) => (
    <span className='word' ref={wordsSpanRef[index]} key={index} data-word-length={word.length}>
        {word.split('').map((char, charIndex) => (
            <span key={charIndex}>{char}</span>
        ))}
    </span>
))}

                    </div>
                </div>
            )}
            <input
                type='text'
                onKeyDown={handleUserInput}
                className='hidden-input'
                ref={inputRef}
            />
        </div>
    );
}

export default TypingBox