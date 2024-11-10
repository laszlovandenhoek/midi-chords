import { useEffect, useRef } from 'react';
import { MidiInputManager } from 'musicvis-lib';
import { Note as TonalNote } from "tonal";

const keyToPitch = {
    'a': 21, 'w': 22, 's': 23, 'd': 24, 'r': 25, 'f': 26, 't': 27,
    'g': 28, 'h': 29, 'u': 30, 'j': 31, 'i': 32, 'k': 33, 'o': 34,
    'l': 35, ';': 36, '[': 37
};

// Create a singleton instance outside of the component
let midiManagerInstance = null;

export function usePianoEvents(onNotePress, onNoteRelease) {
    const midiManagerRef = useRef(null);

    useEffect(() => {

        // Keyboard handlers
        const handleKeyDown = (event) => {
            if (event.repeat) return;
            const pitch = keyToPitch[event.key.toLowerCase()];
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
            const pitch = keyToPitch[event.key.toLowerCase()];
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
