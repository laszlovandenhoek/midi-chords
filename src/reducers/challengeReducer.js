export const initialState = {
    currentNotes: new Map(),
    challenge: [],
    candidateNotesForChallenge: [],
    challengeIndex: 0,
    previouslyExpected: [],
    incorrectNotes: [],
    challengeStartTime: null,
    challengeNoteTimes: []
}; 

export function challengeReducer(state, action) {
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
            return {
                ...state,
                challengeIndex: state.challengeIndex + 1,
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
                previouslyExpected: state.previouslyExpected.filter(p => p !== pitch),
            };
        }

        default: {
            console.log('⚠️ Unknown action:', action.type);
            return state;
        }
    }
} 