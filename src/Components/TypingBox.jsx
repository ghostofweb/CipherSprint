import {generate} from "random-words";
import UpperMenu from './UpperMenu.jsx';
import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { useTestMode } from "../Context/TestModeContext.jsx";

function TypingBox() {
    
    const inputRef = useRef(null)
    const {testTime} = useTestMode();
    const [wordsArray, setWordsArray] = useState(() => generate(50));
    const [countDown,setCountDown] = useState();
    const [testStart,setTestStart] = useState(false)
    const [testEnd,setTestEnd] = useState(false)
    const [currWordIndex, setCurrWordIndex] = useState(0)
    const [currCharIndex, setCurrCharIndex] = useState(0)

    const wordsSpanRef = useMemo(()=>{
        return Array(wordsArray.length).fill(0).map(i=>createRef(null))  
    },[wordsArray])

    const startTimer = ()=>{
        const intervalId = setInterval(timer,1000)

        function timer(){
            setCountDown((latestCountDown)=>{
                if(latestCountDown === 1){
                    setTestEnd(true);
                    clearInterval(intervalId);
                    return 0;
                }
            })
        }
    }
    const handleUserInput = (e) => {
        const allCurrChars = wordsSpanRef[currWordIndex]?.current?.childNodes;
    
        // Check if allCurrChars is defined
        if (!allCurrChars) {
            console.error("Current characters are not available.");
            return;
        }
    
        // Handle space key for moving to the next word
        if (e.key === " ") {
            e.preventDefault(); // Prevent the default space behavior
    
            // Remove 'current' class from the current character
            if (currCharIndex < allCurrChars.length) {
                allCurrChars[currCharIndex].classList.remove('current');
            }else{
                allCurrChars[currCharIndex - 1].classList.remove('current-right');

            }
    
            // Move to the next word
            setCurrWordIndex(currWordIndex + 1);
            setCurrCharIndex(0);
    
            // Highlight the first character of the next word, if it exists
            const nextWordChars = wordsSpanRef[currWordIndex + 1]?.current?.childNodes;
            if (nextWordChars && nextWordChars.length > 0) {
                nextWordChars[0].className = 'current'; // Set the first character of the next word as current
            }
            return;
        }

        if(e.keyCode === 8){
            // logic for backspace
            if(currCharIndex !== 0){

                if(allCurrChars.length === currCharIndex){
                    if(allCurrChars[currCharIndex-1].className.includes('extra')){
                        allCurrChars[currCharIndex-1].remove()
                        allCurrChars[currCharIndex - 2].className += " current-right"
                    }else{
                    allCurrChars[currCharIndex - 1].className = 'current';
                    }
                   setCurrCharIndex(currCharIndex - 1);
                   return;
                }

                allCurrChars[currCharIndex].className = ' '
                allCurrChars[currCharIndex-1].className = 'current'
                setCurrCharIndex(currCharIndex - 1)
        }
        return;
    }
    if(currCharIndex === allCurrChars.length){
        //extra words
        let newSpan = document.createElement("span");
        newSpan.innerText = e.key;
        newSpan.className = 'incorrect extra current-right'
        allCurrChars[currCharIndex-1].classList.remove("current-right")
        wordsSpanRef[currWordIndex].current.append(newSpan)
        setCurrCharIndex(currCharIndex + 1);
        return;
    }
    
        // Handle character input
        if (currCharIndex < allCurrChars.length) {
            if (e.key === allCurrChars[currCharIndex].innerText) {
                allCurrChars[currCharIndex].className = 'correct';
                console.log("correct");
            } else {
                allCurrChars[currCharIndex].className = 'incorrect';
                console.log("incorrect");
            }
    
            // Check if we reached the end of the current word
            if (currCharIndex + 1 === allCurrChars.length) {
                allCurrChars[currCharIndex].className += ' current-right'; // Indicate the end of the word
            } else {
                allCurrChars[currCharIndex + 1].className = 'current'; // Set the next character as current
            }
    
            // Update current character index
            setCurrCharIndex(currCharIndex + 1);
        } else {
            console.error("Current character index is out of bounds.");
        }
    };
    
    function focusInput(){ 
        inputRef.current.focus()
    }
    useEffect(()=>{
        setCountDown(testTime)
    },[testTime])
    useEffect(()=>{
        focusInput()
        wordsSpanRef[0].current.childNodes[0].className = "current"
    },[])

    
    return (
        <div>
            <UpperMenu countDown={countDown} />
            {(testEnd) ? (
                <h1>Test Over</h1>
            ) : (
                <div className="type-box" onClick={focusInput}>
                    <div className='words'>
                        {
                            wordsArray.map((word, index) => (
                                <span className='word' ref={wordsSpanRef[index]} key={index}>
                                    {word.split('').map((char, charIndex) => (
                                        <span key={charIndex}>{char}</span>
                                    ))}
                                </span>
                            ))
                        }
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
export default TypingBox;