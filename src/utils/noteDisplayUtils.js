import { KeyState } from '../types/KeyState';

export function notesToDisplay(state) {
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