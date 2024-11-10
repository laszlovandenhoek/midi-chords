import { Piano } from 'musicvis-lib';
import { DurationValue, Note, Scale } from "tonal";

export const rest = "R";

export class ChallengeChord {
    constructor(notes, duration) {
        this.notes = notes.map(n => Note.get(n));
        this.duration = duration;
    }
}

export function getExercisePattern(notes) {
    const pitch = notes[0];
    const note = Note.get(Note.fromMidi(pitch));

    const { minPitch, maxPitch } = Piano.pianoPitchRange.get(88);
    const minNote = Note.get(Note.fromMidi(minPitch));
    const maxNote = Note.get(Note.fromMidi(maxPitch));

    const scale = Scale.rangeOf(`${note.pc} major`)(minNote.name, maxNote.name);

    const startIndex = scale.findIndex(n => Note.get(n).letter === note.letter);
    const endIndex = scale.slice().reverse().findIndex(n => Note.get(n).letter === note.letter);
    const largestSlice = scale.slice(startIndex, scale.length - endIndex).slice(0, 8);

    const pattern = largestSlice.map(n => new ChallengeChord([n], DurationValue.get("s")));

    return [pattern]; //one hand only
}

export function getCherny1Pattern() {

    const sixteenth = DurationValue.get("s");
    const eighth = DurationValue.get("e");
    const quarter = DurationValue.get("q");
    const half = DurationValue.get("h");

    const leftNotes = [
        new ChallengeChord(['C4', 'E4'], quarter), new ChallengeChord([rest], half), new ChallengeChord(['G3', 'B3', 'F4'], quarter),
        new ChallengeChord(['C4', 'E4'], quarter), new ChallengeChord([rest], half), new ChallengeChord(['G3', 'B3', 'F4'], quarter),
        new ChallengeChord(['C4', 'E4'], quarter), new ChallengeChord(['G3', 'B3', 'F4'], quarter),
        new ChallengeChord(['C4', 'E4'], quarter), new ChallengeChord(['G3', 'B3', 'F4'], quarter),
        new ChallengeChord(['C4', 'E4'], quarter)
    ];
    
    const rightNotes = [
        ['C5'], ['D5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['D5'],
        ['C5'], ['D5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['D5'],
        ['C5'], ['E5'], ['G5'], ['E5'], ['D5'], ['G5'], ['F5'], ['D5'], ['C5'], ['E5'], ['G5'], ['E5'], ['D5'], ['G5'], ['F5'], ['D5'],
        ['C5'], ['D5'], ['E5'], ['F5'], ['G5'], ['A5'], ['B5'], ['C6'] // the final C5 is an eighth note, we add it separately
    ];
    const rightNotesWithDurations = rightNotes.map(n => new ChallengeChord(n, sixteenth));
    const right = [...rightNotesWithDurations, new ChallengeChord(['C5'], eighth)];

    return [leftNotes, right]; //two hands
}
