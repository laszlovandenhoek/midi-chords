import { useEffect, useRef } from 'react';
import { MidiInputManager } from 'musicvis-lib';
import { Note as TonalNote } from "tonal";

// "a" corresponds to A0, which is the lowest note on an 88-key piano.
const keyToPitchNoShift = {
    'a': 21, 'w': 22, 's': 23, 'd': 24, 'r': 25, 'f': 26, 't': 27,
    'g': 28, 'h': 29, 'u': 30, 'j': 31, 'i': 32, 'k': 33, 'o': 34,
    'l': 35, ';': 36, '[': 37
};

//like keyToPitchNoShift but with shift key, shifted up by one octave.
const keyToPitchWithShift = {
    'A': 33, 'W': 34, 'S': 35, 'D': 36, 'R': 37, 'F': 38, 'T': 39,
    'G': 40, 'H': 41, 'U': 42, 'J': 43, 'I': 44, 'K': 45, 'O': 46,
    'L': 47, ':': 48, '{': 49
};

const keyToPitch = { ...keyToPitchNoShift, ...keyToPitchWithShift };

// Create a singleton instance outside of the component
let midiManagerInstance = null;

export function usePianoEvents(onNotePress, onNoteRelease) {
    const midiManagerRef = useRef(null);

    useEffect(() => {

        // Keyboard handlers
        const handleKeyDown = (event) => {
            if (event.repeat) return;
            const pitch = keyToPitch[event.key];
            if (pitch) {
                onNotePress({
                    pitch,
                    note: TonalNote.get(TonalNote.fromMidiSharps(pitch)),
                    timestamp: performance.now(),
                    source: 'keyboard'
                });
            }
        };

        const handleKeyUp = (event) => {
            const pitch = keyToPitch[event.key];
            if (pitch) {
                onNoteRelease({
                    pitch,
                    note: TonalNote.get(TonalNote.fromMidiSharps(pitch)),
                    timestamp: performance.now(),
                    source: 'keyboard'
                });
            }
        };

        // MIDI handlers
        const handleMidiNotePress = (note) => {
            onNotePress({
                pitch: note.pitch,
                note: TonalNote.get(TonalNote.fromMidiSharps(note.pitch)),
                timestamp: performance.now(),
                source: 'midi'
            });
        };

        const handleMidiNoteRelease = (note) => {
            onNoteRelease({
                pitch: note,
                note: TonalNote.get(TonalNote.fromMidiSharps(note)),
                timestamp: performance.now(),
                source: 'midi'
            });
        };

        let midiLiveData = [];

        // Initialize only once if not already created
        if (!midiManagerInstance) {
            midiManagerInstance = new MidiInputManager(
                () => midiLiveData,
                data => midiLiveData = data,
                handleMidiNotePress,
                handleMidiNoteRelease
            );
        }
        midiManagerRef.current = midiManagerInstance;

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            
            // Recreate the manager with no-op callbacks to prevent any further updates
            midiManagerInstance.current = null;
            
            // Clear the live data
            midiLiveData = [];
        };
    }, [onNotePress, onNoteRelease]);
} 
