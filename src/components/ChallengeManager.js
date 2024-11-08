import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { KeyState } from '../types/KeyState';
import { Scale, Note as TonalNote, Midi as TonalMidi } from "tonal";
import PianoKeyboard from './PianoKeyboard';
import { Piano } from 'musicvis-lib';

const calculateViewSize = () => ({
    outerWidth: Math.floor(window.innerWidth - 10),
    outerHeight: Math.floor(Math.min((window.innerWidth - 10) / 4, window.innerHeight - 200))
});

const initialState = {
    currentNotes: new Map(),
    challenge: [],
    candidateNotesForChallenge: [],
    challengeIndex: 0,
    previouslyExpected: [],
    incorrectNotes: [],
    challengeStartTime: null,
    challengeNoteTimes: []
};

function challengeReducer(state, action) {
    switch (action.type) {
        case 'SET_NEW_CHALLENGE': {
            console.log('🎯 SET_NEW_CHALLENGE:', action.payload);
            const { exercisePattern } = action.payload;
            return {
                ...state,
                challenge: exercisePattern,
                challengeIndex: 0,
                previouslyExpected: [],
                challengeStartTime: null,
                challengeNoteTimes: [],
                candidateNotesForChallenge: []
            };
        }

        case 'RESET_CANDIDATE_NOTES': {
            console.log('🔄 RESET_CANDIDATE_NOTES');
            return {
                ...state,
                candidateNotesForChallenge: []
            };
        }

        case 'RESET_CHALLENGE': {
            console.log('🔄 RESET_CHALLENGE');
            return initialState;
        }

        case 'ADVANCE_CHALLENGE': {
            console.log('⏭️ ADVANCE_CHALLENGE');
            const newIndex = state.challengeIndex + 1;

            return {
                ...state,
                challengeIndex: newIndex,
            };
        }

        case 'ADD_NOTE': {
            console.log('➕ ADD_NOTE:', action.payload);
            const { note, now } = action.payload;
            const newNotes = new Map(state.currentNotes);
            newNotes.set(note.pitch, note);

            if (state.challenge.length > 0 && state.challengeIndex < state.challenge.length) {
                const expectedNotes = state.challenge[state.challengeIndex];

                if (expectedNotes.includes(note.pitch)) {
                    const startTime = state.challengeStartTime === null ? now : state.challengeStartTime;
                    const noteTime = now - startTime;
                    const challengeNoteTimes = [...state.challengeNoteTimes, noteTime];

                    return {
                        ...state,
                        currentNotes: newNotes,
                        challengeStartTime: startTime,
                        previouslyExpected: [...state.previouslyExpected, note.pitch],
                        challengeNoteTimes: challengeNoteTimes
                    };
                } else {
                    return {
                        ...state,
                        currentNotes: newNotes,
                        incorrectNotes: [...state.incorrectNotes, note.pitch]
                    };
                }
            } else {
                return {
                    ...state,
                    currentNotes: newNotes,
                    candidateNotesForChallenge: [...state.candidateNotesForChallenge, note.pitch]
                };
            }
        }

        case 'REMOVE_NOTE': {
            console.log('➖ REMOVE_NOTE:', action.payload);
            const { pitch } = action.payload;
            const newNotes = new Map(state.currentNotes);

            newNotes.delete(pitch);

            return {
                ...state,
                currentNotes: newNotes,
                previouslyExpected: state.previouslyExpected.filter(p => p !== pitch), //not sure why this is needed
            };
        }

        default: {
            console.log('⚠️ Unknown action:', action.type);
            return state;
        }
    }
}

function getExercisePattern(notes) {
    const pitch = notes[0];
    const note = TonalNote.get(TonalNote.fromMidi(pitch));

    const { minPitch, maxPitch } = Piano.pianoPitchRange.get(88);
    const minNote = TonalNote.get(TonalNote.fromMidi(minPitch));
    const maxNote = TonalNote.get(TonalNote.fromMidi(maxPitch));

    const scale = Scale.rangeOf(`${note.pc} major`)(minNote.name, maxNote.name);

    const startIndex = scale.findIndex(n => TonalNote.get(n).letter === note.letter);
    const endIndex = scale.slice().reverse().findIndex(n => TonalNote.get(n).letter === note.letter);
    const largestSlice = scale.slice(startIndex, scale.length - endIndex);

    const exercisePattern = largestSlice.map(n => [TonalMidi.toMidi(n)]);
    return exercisePattern;
}

function notesToDisplay(state) {
    const { currentNotes, previouslyExpected, challenge, challengeIndex, incorrectNotes } = state;

    const expectedNotes = challengeIndex < challenge.length ? challenge[challengeIndex] : []

    const notesToDisplay = new Map();

    for (const note of incorrectNotes) {
        notesToDisplay.set(note, KeyState.Bad);
    }

    for (const note of expectedNotes) {
        notesToDisplay.set(note, KeyState.Next);
    }

    for (const note of currentNotes.keys()) {
        notesToDisplay.set(note, KeyState.Down);
    }

    for (const note of previouslyExpected) {
        if (challenge.slice(0, challengeIndex).flat().includes(note)) {
            notesToDisplay.set(note, KeyState.Done);
        }
    }

    return notesToDisplay;
}

function ChallengeManager({ onNotePress, onNoteRelease }) {

    // Window size
    const [viewSize, setViewSize] = useState(calculateViewSize());

    const onResize = useCallback(() => {
        setViewSize(calculateViewSize());
    }, []);

    useEffect(() => {
        window.addEventListener('resize', onResize, false);
        onResize();
        return () => window.removeEventListener('resize', onResize);
    }, [onResize]);

    // Challenge state
    const [state, dispatch] = useReducer(challengeReducer, initialState);

    const isChallengeActive = () => state.challenge.length > 0;
    const isChallengeFinished = () => state.challengeIndex >= state.challenge.length;

    const checkCancelKeys = (currentNotes) => {
        const cancelKeys = [21, 22];
        return cancelKeys.length === currentNotes.size && cancelKeys.every(key => currentNotes.has(key));
    };

    useEffect(() => {
        if (isChallengeActive() && checkCancelKeys(state.currentNotes)) {
            dispatch({ type: 'RESET_CHALLENGE' });
        }
    }, [isChallengeActive(), state.currentNotes]);

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

    // set exercise pattern only if there is one candidate note and no challenge is active
    useEffect(() => {
        if (state.currentNotes.size === 0 && state.challenge.length === 0 && state.candidateNotesForChallenge.length > 0) {
            if (state.candidateNotesForChallenge.length === 1) {
                dispatch({ type: 'SET_NEW_CHALLENGE', payload: { exercisePattern: getExercisePattern(state.candidateNotesForChallenge) } });
            } else {
                dispatch({ type: 'RESET_CANDIDATE_NOTES' });
            }
        }
    }, [
        state.challenge.length,
        state.currentNotes.size,
    ]);

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