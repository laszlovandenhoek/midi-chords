import { KeyState } from '../types/KeyState';

export function notesToDisplay(state) {
    const { currentNotes, challenge } = state;
    const notesToDisplay = new Map();

    if (challenge) {
        for (const note of currentNotes.keys()) {
            notesToDisplay.set(note, KeyState.Good);
        }

        for (const note of challenge.incorrectNotes) {
            if (currentNotes.has(note)) {
                notesToDisplay.set(note, KeyState.Bad);
            } else {
                notesToDisplay.set(note, KeyState.Mistake);
            }
        }

        for (const handIndex of challenge.indexes.keys()) {
            const hand = challenge.sequences[handIndex];
            const challengeIndex = challenge.indexes[handIndex];
            const expectedNotes = challengeIndex < hand.length ? hand[challengeIndex].notes : []
            for (const note of expectedNotes) {
                if (!note.empty) {
                    notesToDisplay.set(note.midi, KeyState.Next);
                }
            }
        }

        for (const note of challenge.previouslyExpected) {
            notesToDisplay.set(note, KeyState.Done);
        }
    } else {
        for (const note of currentNotes.keys()) {
            notesToDisplay.set(note, KeyState.Down);
        }
    }

    return notesToDisplay;
} 