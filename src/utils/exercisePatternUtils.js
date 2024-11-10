import { Piano } from 'musicvis-lib';
import { DurationValue, Note, Scale } from "tonal";

export const rest = "R";

export class ChallengeChord {
    constructor(notes, duration) {
        this.notes = notes;
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
    const largestSlice = scale.slice(startIndex, scale.length - endIndex);

    const pattern = largestSlice.map(n => new ChallengeChord([Note.get(n)], DurationValue.get("s")));

    return [pattern]; //one hand only
}

export function getCherny1Pattern() {

    const sixteenth = DurationValue.get("s");
    const eighth = DurationValue.get("e");
    const quarter = DurationValue.get("q");

    const rightHandPattern = [
        ['C5'], ['D5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['D5'],
        ['C5'], ['D5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['F5'], ['G5'], ['F5'], ['E5'], ['D5'],
        ['C5'], ['E5'], ['G5'], ['E5'], ['D5'], ['G5'], ['F5'], ['D5'], ['C5'], ['E5'], ['G5'], ['E5'], ['D5'], ['G5'], ['F5'], ['D5'],
        ['C5'], ['D5'], ['E5'], ['F5'], ['G5'], ['A5'], ['B5'], ['C6'] // the final C5 is an eighth note, we add it later
    ];

    const leftHandPattern = [
        ['C4', 'E4'], [rest], [rest], ['G3', 'B3', 'F4'],
        ['C4', 'E4'], [rest], [rest], ['G3', 'B3', 'F4'],
        ['C4', 'E4'], ['G3', 'B3', 'F4'], ['C4', 'E4'], ['G3', 'B3', 'F4'],
        ['C4', 'E4']
    ];

    const rightNotes = rightHandPattern
        .map(notes => notes.map(n => Note.get(n)));

    const leftNotes = leftHandPattern
        .map(notes => notes.map(n => Note.get(n)));

    const rightNotesWithDurations = rightNotes.map(n => new ChallengeChord(n, sixteenth));

    const leftNotesWithDurations = leftNotes.map(n => new ChallengeChord(n, quarter));

    const right = [...rightNotesWithDurations, new ChallengeChord([Note.get('C5')], eighth)];
    const left = leftNotesWithDurations;

    return [left, right]; //two hands
}
