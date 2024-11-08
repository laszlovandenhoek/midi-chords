import { Scale, Note as TonalNote, Midi as TonalMidi } from "tonal";
import { Piano } from 'musicvis-lib';

export function getExercisePattern(notes) {
    const pitch = notes[0];
    const note = TonalNote.get(TonalNote.fromMidi(pitch));

    const { minPitch, maxPitch } = Piano.pianoPitchRange.get(88);
    const minNote = TonalNote.get(TonalNote.fromMidi(minPitch));
    const maxNote = TonalNote.get(TonalNote.fromMidi(maxPitch));

    const scale = Scale.rangeOf(`${note.pc} major`)(minNote.name, maxNote.name);

    const startIndex = scale.findIndex(n => TonalNote.get(n).letter === note.letter);
    const endIndex = scale.slice().reverse().findIndex(n => TonalNote.get(n).letter === note.letter);
    const largestSlice = scale.slice(startIndex, scale.length - endIndex);

    return largestSlice.map(n => [TonalMidi.toMidi(n)]);
} 