import { Challenge } from '../models/Challenge';

export const initialState = {
    currentNotes: new Map(),
    challenge: null,
    candidateNotesForChallenge: [],
};

export function challengeReducer(state, action) {
    switch (action.type) {
        case 'SET_NEW_CHALLENGE': {
            const { exercisePattern } = action.payload;
            console.log('🎯 SET_NEW_CHALLENGE:', exercisePattern);
            return {
                ...state,
                challenge: new Challenge(exercisePattern),
            };
        }

        case 'RESET_CANDIDATE_NOTES': {
            // console.log('🔄 RESET_CANDIDATE_NOTES');
            return {
                ...state,
                candidateNotesForChallenge: []
            };
        }

        case 'RESET_CHALLENGE': {
            // console.log('🔄 RESET_CHALLENGE');
            return initialState;
        }

        case 'TRY_ADVANCE_CHALLENGE': {
            console.log('⏭️ TRY_ADVANCE_CHALLENGE');
            return {
                ...state,
                challenge: state.challenge.tryAdvance(state.currentNotes)
            };
        }

        case 'ADD_NOTE': {
            console.log('➕ ADD_NOTE:', action.payload);
            const { note } = action.payload;
            const newNotes = new Map(state.currentNotes);
            newNotes.set(note.pitch, note);

            if (state.challenge) {
                return {
                    ...state,
                    currentNotes: newNotes,
                };
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
                challenge: state.challenge?.release(pitch)
            };
        }

        default: {
            console.log('⚠️ Unknown action:', action.type);
            return state;
        }
    }
} 