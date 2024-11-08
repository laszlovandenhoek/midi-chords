import React, { useState, useCallback, useRef } from 'react';
import './style/App.css';
import ChallengeManager from './components/ChallengeManager';
import { Chord } from "tonal";
import { usePianoEvents } from './hooks/usePianoEvents';
import { useWakeLock } from './hooks/useWakeLock';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

export default function App() {
    // Use the wake lock hook
    useWakeLock();

    // Track currently pressed keys
    const [activeNotes, setActiveNotes] = useState({});

    // Create refs for the note handlers
    const notePress = useRef(null);
    const noteRelease = useRef(null);

    const handleNotePress = useCallback((noteEvent) => {
        setActiveNotes(prev => {
            const next = { ...prev };
            next[noteEvent.pitch] = noteEvent;
            return next;
        });
        // Call the ChallengeManager's handler if it exists
        if (notePress.current) {
            notePress.current(noteEvent);
        }
    }, []);

    const handleNoteRelease = useCallback((noteEvent) => {
        setActiveNotes(prev => {
            const next = { ...prev };
            delete next[noteEvent.pitch];
            return next;
        });
        // Call the ChallengeManager's handler if it exists
        if (noteRelease.current) {
            noteRelease.current(noteEvent.pitch);
        }
    }, []);

    usePianoEvents(handleNotePress, handleNoteRelease);

    const getChordName = (notes) => {
        const noteLetters = notes.map(d => d.note.pc);
        return Chord.detect(noteLetters);
    }

    const notes = Object.values(activeNotes)
        .sort((a, b) => a.pitch - b.pitch);

    return (
        <div className={`App dark`} >
            <div className='chordInfo'>
                <div>
                    {notes.map(d => d.note.name).join(' ')}
                </div>
                <div>
                    Chord name: {getChordName(notes).join(', ')}
                </div>
            </div>
            <div className='explanation'>
                <span>
                    <FontAwesomeIcon icon={faInfoCircle} />&nbsp;
                    Connect a MIDI device and play some notes to see the chord type.
                </span>
            </div>
            <ChallengeManager
                name='Challenge Manager'
                onNotePress={notePress}
                onNoteRelease={noteRelease}
            />
            <div className='githubLink'>
                <p>
                    <a href='https://github.com/fheyen/midi-chords'>
                        <FontAwesomeIcon icon={faGithub} />&nbsp;
                        https://github.com/fheyen/midi-chords
                    </a>
                </p>
                <p>
                    Using&nbsp;
                    <a href='https://github.com/tonaljs/tonal/tree/master/packages/chord-detect'>
                        tonaljs
                    </a>.
                </p>
            </div>
        </div >
    );
}
