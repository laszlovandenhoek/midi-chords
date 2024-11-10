import React, { useEffect, useReducer, useState } from 'react';
import PianoKeyboard from './PianoKeyboard';
import { challengeReducer, initialState } from '../reducers/challengeReducer';
import { getExercisePattern, getCherny1Pattern } from '../utils/exercisePatternUtils';
import { notesToDisplay } from '../utils/noteDisplayUtils';
import { useWindowSize } from '../hooks/useWindowSize';

function ChallengeManager({ onNotePress, onNoteRelease }) {
    const viewSize = useWindowSize();
    const [state, dispatch] = useReducer(challengeReducer, initialState);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedNotes, setRecordedNotes] = useState([]);
    const [isChernyMode, setIsChernyMode] = useState(false);

    const isChallengeActive = !!state.challenge;
    const isChallengeFinished = state.challenge?.isFinished() ?? false;

    useEffect(() => {
        const addCurrentNote = (note) => {
            dispatch({ type: 'ADD_NOTE', payload: { note } });

            if (isRecording) {
                setRecordedNotes(prev => [...prev, note.note.name]);
            }
        };

        const removeCurrentNote = (pitch) => {
            dispatch({ type: 'REMOVE_NOTE', payload: { pitch } });
        };

        if (onNotePress) onNotePress.current = addCurrentNote;
        if (onNoteRelease) onNoteRelease.current = removeCurrentNote;

        const handleKeyPress = (event) => {
            if (event.key === 'q') {
                setIsRecording(prev => {
                    if (prev) {
                        setRecordedNotes(currentNotes => {
                            console.log('Recorded notes:', currentNotes);
                            return [];
                        });
                    }
                    return !prev;
                });
            }
        };

        window.addEventListener('keypress', handleKeyPress);

        return () => {
            if (onNotePress) onNotePress.current = null;
            if (onNoteRelease) onNoteRelease.current = null;
            window.removeEventListener('keypress', handleKeyPress);
        };
    }, [isRecording, onNotePress, onNoteRelease]);

    useEffect(() => {
        if (isRecording) return;

        if (state.currentNotes.size === 0 && !isChallengeActive && state.candidateNotesForChallenge.length > 0) {
            if (isChernyMode) {
                dispatch({ type: 'SET_NEW_CHALLENGE', payload: { exercisePattern: getCherny1Pattern() } });
            } else if (state.candidateNotesForChallenge.length === 1) {
                dispatch({ type: 'SET_NEW_CHALLENGE', payload: { exercisePattern: getExercisePattern(state.candidateNotesForChallenge) } });
            } else {
                dispatch({ type: 'RESET_CANDIDATE_NOTES' });
            }
        }
    }, [state.currentNotes.size, isChallengeActive, state.candidateNotesForChallenge, isRecording, isChernyMode]);

    useEffect(() => {
        if (isRecording) return;

        if (isChallengeActive) {
            if (!isChallengeFinished) {
                dispatch({ type: 'TRY_ADVANCE_CHALLENGE' });
            } else if (state.currentNotes.size === 0) {
                dispatch({ type: 'RESET_CHALLENGE' });
            }
        }
    }, [isChallengeActive, isChallengeFinished, state.currentNotes, isRecording]);

    useEffect(() => {
        const cancelKeys = [21, 22];
        const checkCancelKeys = (currentNotes) =>
            cancelKeys.length === currentNotes.size &&
            cancelKeys.every(key => currentNotes.has(key));

        if (checkCancelKeys(state.currentNotes)) {
            if (isRecording) {
                setIsRecording(false);
                setRecordedNotes([]);
            } else if (isChallengeActive) {
                dispatch({ type: 'RESET_CHALLENGE' });
            }
        }
    }, [isChallengeActive, state.currentNotes, isRecording]);

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={isChernyMode}
                        onChange={(e) => {
                            setIsChernyMode(e.target.checked);
                            dispatch({ type: 'RESET_CHALLENGE' });
                        }}
                    />
                    {' '}Czerny Exercise Mode
                </label>
            </div>
            <div>
                {isRecording && <div style={{ color: 'red' }}>Recording...</div>}
                {isChallengeActive ?
                    isChallengeFinished ?
                        `Challenge finished!` :
                        `Current challenge: ${state.challenge.indexes.map(x => x + 1).join(',')} / ${state.challenge.sequences.map(x => x.length).join(',')}`
                    : isChernyMode ?
                        "Play any note to start Czerny exercise" :
                        "Play a note to select a scale"
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