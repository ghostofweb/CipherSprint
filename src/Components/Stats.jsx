import React, { useEffect, useState } from 'react';
import Graph from './Graph';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { Bounce, toast } from 'react-toastify';

function Stats({
    wpm,
    accuracy,
    correctChars,
    incorrectChars,
    missedChars,
    extraChars,
    graphData
}) {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const safeWpm = isNaN(wpm) ? 0 : wpm;
    const safeAccuracy = isNaN(accuracy) ? 0 : accuracy;

    const [hasSaved, setHasSaved] = useState(false); // Track if data has been saved

    let timeSet = new Set();
    const newGraph = graphData.filter(i => {
        if (!timeSet.has(i[0])) {
            timeSet.add(i[0]);
            return i;
        }
        return null;
    });

    const pushDatatoDb = async () => {
        if (isNaN(safeAccuracy)) {
            toast.warning('Invalid test', {
                position: 'top-right',
                autoClose: 5000,
                theme: 'dark',
                transition: Bounce,
            });
            return;
        }
        if (currentUser && !hasSaved) { // Only save if not already saved
            try {
                await addDoc(collection(firestore, 'results'), {
                    userId: currentUser.uid,
                    wpm: safeWpm,
                    accuracy: safeAccuracy,
                    timeStamp: new Date(),
                    characters: `${correctChars}/${incorrectChars}/${missedChars}/${extraChars}`,
                });
                toast.success('Successfully saved!', {
                    position: 'top-right',
                    autoClose: 5000,
                    theme: 'dark',
                    transition: Bounce,
                });
                setHasSaved(true); // Prevent further saves
            } catch (error) {
                console.log(error);
                toast.error("Couldn't save the data", {
                    position: 'top-right',
                    autoClose: 5000,
                    theme: 'dark',
                    transition: Bounce,
                });
            }
        } else if (!currentUser) {
            toast.warning('Please log in first', {
                position: 'top-right',
                autoClose: 5000,
                theme: 'dark',
                transition: Bounce,
            });
        }
    };

    useEffect(() => {
        if (safeWpm && safeAccuracy && currentUser && !hasSaved) {
            pushDatatoDb(); // Save only if this is the first save
        }
    }, [safeWpm, safeAccuracy, currentUser, hasSaved]); 
    

    return (
        <div className="stats-box">
            <div className="left-stats">
                <div className="title">WPM</div>
                <div className="subtitle">{safeWpm}</div>
                <div className="title">Accuracy</div>
                <div className="subtitle">{safeAccuracy}</div>
                <div className="title">Characters</div>
                <div className="subtitle">
                    {correctChars}/{incorrectChars}/{missedChars}/{extraChars}
                </div>
            </div>
            <div className="right-stats">
                <Graph graphData={newGraph} />
            </div>
        </div>
    );
}

export default Stats;
