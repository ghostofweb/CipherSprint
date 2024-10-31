import { generate } from "random-words";
import UpperMenu from './UpperMenu.jsx';
import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { useTestMode } from "../Context/TestModeContext.jsx";
import Stats from "./Stats.jsx";

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

    const [correctChars,setCorrectChars] = useState(0)
    const [incorrectChars,setIncorrectChars] = useState(0)
    const [missedChars,setMissedChars] = useState(0)
    const [extraChars,setExtraChars] = useState(0)
    const [correctWords,setCorrectWords] = useState(0) 
    const [graphData,setGraphData] = useState([])

    const wordsSpanRef = useMemo(() => {
        return Array(wordsArray.length).fill(0).map(() => createRef(null));
    }, [wordsArray]);

    const startTimer = () => {
        const intervalId = setInterval(() => {
            setInteralId(intervalId)
            setCountDown((prevCount) => {
                setCorrectChars((correctChars)=>{
                    setGraphData((graphData)=>{
                        return[...graphData,[
                            testTime - prevCount+ 1,
                            (correctChars/5)/((testTime - prevCount + 1)/60)
                        ]]
                    })
                    return correctChars;
                })
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
        // console.log(e);

        if (!wordsSpanRef[currWordIndex]?.current) {
            return;  // Exit if current word reference is not available
        }
    
        if (!testStart) {
          startTimer();
          setTestStart(true);
        }
    
        const allCurrChars = wordsSpanRef[currWordIndex].current.childNodes;
    
        // console.log(allCurrChars);
        if (e.keyCode === 32) {
          //logic for space
    
          let correctCharsInWord =
            wordsSpanRef[currWordIndex].current.querySelectorAll(".correct");
    
          if (correctCharsInWord.length === allCurrChars.length) {
            setCorrectWords(correctWords + 1);
          }
    
          if (allCurrChars.length <= currCharIndex) {
            //remove cursor from last place in word
            allCurrChars[currCharIndex - 1].classList.remove("current-right");
          } else {
            //remove cursor from in between of the word
            allCurrChars[currCharIndex].classList.remove("current");
            setMissedChars(missedChars + (allCurrChars - currCharIndex));
          }
    
          wordsSpanRef[currWordIndex + 1].current.childNodes[0].className =
            "current";
          setCurrWordIndex(currWordIndex + 1);
          setCurrCharIndex(0);
          return;
        }
    
        if (e.keyCode === 8) {
          //Logic for backspace
          if (currCharIndex !== 0) {
            if (allCurrChars.length === currCharIndex) {
              if (allCurrChars[currCharIndex - 1].className.includes("extra")) {
                allCurrChars[currCharIndex - 1].remove();
                allCurrChars[currCharIndex - 2].className += " current-right";
              } else {
                allCurrChars[currCharIndex - 1].className = "current";
              }
              setCurrCharIndex(currCharIndex - 1);
              return;
            }
    
            allCurrChars[currCharIndex].className = "";
            allCurrChars[currCharIndex - 1].className = "current";
            setCurrCharIndex(currCharIndex - 1);
          }
    
          return;
        }
    
        if (currCharIndex === allCurrChars.length) {
          let newSpan = document.createElement("span");
          newSpan.innerText = e.key;
          newSpan.className = "incorrect extra current-right";
          allCurrChars[currCharIndex - 1].classList.remove("current-right");
          wordsSpanRef[currWordIndex].current.append(newSpan);
          setCurrCharIndex(currCharIndex + 1);
          setExtraChars(extraChars + 1);
          return;
        }
    
        if (e.key === allCurrChars[currCharIndex].innerText) {
          console.log("input correct");
          allCurrChars[currCharIndex].className = "correct";
          setCorrectChars(correctChars + 1);
        } else {
          console.log("incorrect input");
          allCurrChars[currCharIndex].className = "incorrect";
          setIncorrectChars(incorrectChars + 1);
        }
    
        if (currCharIndex + 1 === allCurrChars.length) {
          allCurrChars[currCharIndex].className += " current-right";
        } else {
          allCurrChars[currCharIndex + 1].className = "current";
        }
    
        setCurrCharIndex(currCharIndex + 1);
      };
    
    
      const calculateWPM = () => {
        return Math.round(correctChars / 5 / (testTime / 60));
      };
      
    
      const calculateAcc = () => {
        return Math.round((correctWords / currWordIndex) * 100);
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
                <Stats wpm={calculateWPM()} accuracy={calculateAcc()} correctChars={correctChars} incorrectChars = {incorrectChars} missedChars={missedChars} extraChars={extraChars}
                graphData={graphData}/>
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