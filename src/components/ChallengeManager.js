import React, { useEffect, useReducer } from 'react';
import PianoKeyboard from './PianoKeyboard';
import { challengeReducer, initialState } from '../reducers/challengeReducer';
import { getExercisePattern } from '../utils/exercisePatternUtils';
import { notesToDisplay } from '../utils/noteDisplayUtils';
import { useWindowSize } from '../hooks/useWindowSize';

function ChallengeManager({ onNotePress, onNoteRelease }) {
    const viewSize = useWindowSize();
    const [state, dispatch] = useReducer(challengeReducer, initialState);

    const isChallengeActive = () => state.challenge.length > 0;
    const isChallengeFinished = () => state.challengeIndex >= state.challenge.length;

    useEffect(() => {
        const addCurrentNote = (note) => {
            const now = Date.now();
            dispatch({ type: 'ADD_NOTE', payload: { note, now } });
        };

        const removeCurrentNote = (pitch) => {
            dispatch({ type: 'REMOVE_NOTE', payload: { pitch } });
        };

        if (onNotePress) onNotePress.current = addCurrentNote;
        if (onNoteRelease) onNoteRelease.current = removeCurrentNote;

        return () => {
            if (onNotePress) onNotePress.current = null;
            if (onNoteRelease) onNoteRelease.current = null;
        };
    }, []);

    useEffect(() => {
        if (state.currentNotes.size === 0 && state.challenge.length === 0 && state.candidateNotesForChallenge.length > 0) {
            if (state.candidateNotesForChallenge.length === 1) {
                dispatch({ type: 'SET_NEW_CHALLENGE', payload: { exercisePattern: getExercisePattern(state.candidateNotesForChallenge) } });
            } else {
                dispatch({ type: 'RESET_CANDIDATE_NOTES' });
            }
        }
    }, [state.challenge.length, state.currentNotes.size]);

    useEffect(() => {
        if (isChallengeActive()) {
            if (!isChallengeFinished()) {
                const expectedNotes = state.challenge[state.challengeIndex];
                if (state.currentNotes.size === expectedNotes.length &&
                    expectedNotes.every(note => state.currentNotes.has(note))) {
                    dispatch({ type: 'ADVANCE_CHALLENGE' });
                }
            } else {
                dispatch({ type: 'RESET_CHALLENGE' });
            }
        }
    }, [isChallengeActive(), isChallengeFinished(), state.currentNotes]);

    useEffect(() => {
        const cancelKeys = [21, 22];
        const checkCancelKeys = (currentNotes) => 
            cancelKeys.length === currentNotes.size && 
            cancelKeys.every(key => currentNotes.has(key));

        if (isChallengeActive() && checkCancelKeys(state.currentNotes)) {
            dispatch({ type: 'RESET_CHALLENGE' });
        }
    }, [isChallengeActive(), state.currentNotes]);

    return (
        <div>
            <div>
                {isChallengeActive() ?
                    isChallengeFinished() ?
                        `Challenge finished!` :
                        `Current challenge: ${state.challengeIndex}/${state.challenge.length}`
                    : "Play a note to select a scale"
                }
            </div>
            <PianoKeyboard
                name='Piano Keyboard'
                viewSize={viewSize}
                currentNotes={notesToDisplay(state)}
                theme='dark'
            />
        </div>
    );
}

export default ChallengeManager; 