import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import {generate} from "random-words";
import UpperMenu from './UpperMenu.jsx';

function TypingBox() {
    
    const inputRef = useRef(null)
    const [wordsArray, setWordsArray] = useState(() => generate(50));

    const  [currWordIndex, setCurrWordIndex] = useState(0)
    const [currCharIndex, setCurrCharIndex] = useState(0)

    const wordsSpanRef = useMemo(()=>{
        return Array(wordsArray.length).fill(0).map(i=>createRef(null))  
    },[wordsArray])

    
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
        focusInput()
        wordsSpanRef[0].current.childNodes[0].className = "current"
    },[])

    
    return (
        <div>
        <div className='type-box' onClick={focusInput}>
            <UpperMenu/>
            <div className='words'>
                {
                    wordsArray.map((word, index) => (
                        <span className='word' ref={wordsSpanRef[index]} key={index}>
                            {word.split('').map((char,charIndex) => (
                                <span key={charIndex}>{char}</span>
                            ))}
                        </span>
                    ))
                }
            </div>
        </div>
        <input
        typeof='text'
        onKeyDown={handleUserInput}
        className='hidden-input'
        ref={inputRef}
        />
        </div>
    );
}

export default TypingBox;