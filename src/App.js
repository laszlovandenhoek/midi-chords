import React, { Component } from 'react';
import './style/App.css';
// Views
import PianoKeyboard from './components/PianoKeyboard';
// API, data etc.
import { Chord, Scale, Midi, Note } from "tonal";
import { MidiInputManager, Note as MusicVisNote } from 'musicvis-lib';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const keyToPitch = {
    'a': 21, 'w': 22, 's': 23, 'd': 24, 'r': 25, 'f': 26, 't': 27,
    'g': 28, 'h': 29, 'u': 30, 'j': 31, 'i': 32, 'k': 33, 'o': 34,
    'l': 35, ';': 36, '[': 37
};
export default class App extends Component {

    constructor(props) {
        super(props);
        // Setup MIDI input
        new MidiInputManager(
            this.getMidiLiveData,
            this.setMidiLiveData,
            this.addCurrentNote,
            this.removeCurrentNote
        );

        this.state = {
            viewSize: {
                outerWidth: 800,
                outerHeight: 600
            },
            midiLiveData: [],
            currentNotes: new Map(),
            challenge: [],
            candidateNotesForChallenge: [],
            expectedNotes: [],
            challengeIndex: 0,
            previouslyExpected: [],
            challengeStartTime: null,
            challengeNoteTimes: [],
            incorrectNotes: new Set()
        };

        this.wakeLock = null;
    }

    componentDidMount() {
        // Scale layout to current screen size
        window.addEventListener('resize', this.onResize, false);
        this.onResize();

        // Add event listeners for visibility change and focus
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('focus', this.requestWakeLock);

        // Request wake lock when the component mounts
        this.requestWakeLock();

        // Add key event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    componentWillUnmount() {
        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('focus', this.requestWakeLock);

        // Release wake lock when component unmounts
        this.releaseWakeLock();

        // Remove key event listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    /**
     * Updates the size state when the window size changes
     * so views can react and redraw
     */
    onResize = () => {
        const w = Math.floor(window.innerWidth - 10);
        this.setState({
            viewSize: {
                outerWidth: w,
                // outerHeight: Math.floor(window.innerHeight - 100)
                outerHeight: Math.floor(Math.min(w / 4, window.innerHeight - 200))
            }
        });
    }

    getMidiLiveData = () => this.state.midiLiveData;

    /**
     * Setter for MIDI input from an instrument
     * @param {Note[]} data array with notes
     */
    setMidiLiveData = (data) => {
        // Work-around so note_off event handling can immediately find the note_on event
        // eslint-disable-next-line
        this.state.midiLiveData = data;
        this.setState({ midiLiveData: data });
    };

    /**
     * Adds a note that is currently played (e.g. keyboard key pressed)
     * @param {Note} note a note
     */
    addCurrentNote = (note) => {
        const newMap = new Map(this.state.currentNotes);
        newMap.set(note.pitch, note);

        if (this.checkCancelKeys(newMap)) {
            this.setState({ currentNotes: newMap }, this.resetChallenge);
        } else if (this.state.expectedNotes.includes(note.pitch)) {
            const now = Date.now();
            if (this.state.challengeStartTime === null) {
                this.setState({ challengeStartTime: now });
            }
            const noteTime = now - (this.state.challengeStartTime || now);

            this.setState(prevState => ({
                currentNotes: newMap,
                previouslyExpected: [...prevState.previouslyExpected, note.pitch],
                challengeNoteTimes: [...prevState.challengeNoteTimes, noteTime],
            }), this.checkChallenge);
        } else if (this.state.challenge.length > 0) {
            this.setState(prevState => ({
                currentNotes: newMap,
                incorrectNotes: new Set(prevState.incorrectNotes).add(note.pitch),
            }));
        } else {
            this.setState({
                currentNotes: newMap,
                incorrectNotes: new Set(),
            });
        }

        if (this.state.challenge.length === 0) {
            this.setState(prevState => ({
                candidateNotesForChallenge: [...prevState.candidateNotesForChallenge, note.pitch]
            }));
        }

    }

    /**
     * Removes a currently played note (e.g. keyboard key no longer pressed)
     * @param {number} pitch pitch of the note to remove
     */
    removeCurrentNote = (pitch) => {
        const newMap = new Map(this.state.currentNotes);
        newMap.delete(pitch);

        // Remove the note from previouslyExpected if it exists
        this.setState(prevState => ({
            currentNotes: newMap,
            previouslyExpected: prevState.previouslyExpected.filter(p => p !== pitch)
        }), this.checkChallenge);

        // If all keys are released, call setNewChallenge
        if (this.state.challenge.length === 0 && newMap.size === 0) {
            this.setNewChallenge();
        }
    }


    setNewChallenge = () => {
        if (this.state.candidateNotesForChallenge.length === 1) {
            const pitch = this.state.candidateNotesForChallenge[0];

            const note = Note.get(Note.fromMidi(pitch));

            const scale = Scale.rangeOf(`${note.pc} major`)(`${note.pc}1`, `${note.pc}7`);

            let exercisePattern = [];

            for (let note of scale) {
                note = Midi.toMidi(note);
                exercisePattern.push([note]);
            }

            this.setState({
                challenge: exercisePattern,
                expectedNotes: exercisePattern[0],
                challengeIndex: 0,
                previouslyExpected: [],
                challengeStartTime: null,
                challengeNoteTimes: [],
                incorrectNotes: new Set(),
            });
        }

        this.setState({
            candidateNotesForChallenge: []
        });
    }

    /**
     * https://github.com/tonaljs/tonal/tree/master/packages/chord
     * Detected chords can be used with https://github.com/tonaljs/tonal/tree/master/packages/chord-type
     * @param {Note[]} notes
     * @returns {String[]} possible chord types
     */
    getChordName(notes) {
        const noteLetters = notes.map(d => d.getLetter());
        return Chord.detect(noteLetters);
    }

    checkChallenge = () => {
        const { challenge, challengeIndex, currentNotes } = this.state;

        if (challenge.length > 0) {
            const expectedNotes = challenge[challengeIndex];

            if (currentNotes.size === expectedNotes.length && expectedNotes.every(note => currentNotes.has(note))) {
                this.advanceChallenge();
            }
        }
    }

    advanceChallenge = () => {
        const { challenge, challengeIndex } = this.state;
        if (challengeIndex < challenge.length - 1) {
            this.setState(prevState => ({
                challengeIndex: prevState.challengeIndex + 1,
                expectedNotes: challenge[challengeIndex + 1],
            }));
        } else {
            this.resetChallenge();
        }
    }

    // Add this new method
    checkCancelKeys = (currentNotes) => {
        const cancelKeys = [21, 22]; //A0 + A#0
        return cancelKeys.length === currentNotes.size && cancelKeys.every(key => currentNotes.has(key));
    }

    // Add this new method
    resetChallenge = () => {
        this.setState({
            challenge: [],
            challengeIndex: 0,
            expectedNotes: [],
            previouslyExpected: [],
            challengeStartTime: null,
            challengeNoteTimes: [],
            incorrectNotes: new Set(),
        });
    }

    requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock is active');
            } catch (err) {
                console.error(`Failed to request Wake Lock: ${err.name}, ${err.message}`);
            }
        } else {
            console.warn('Wake Lock API not supported');
        }
    }

    releaseWakeLock = async () => {
        if (this.wakeLock !== null) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('Wake Lock released');
            } catch (err) {
                console.error(`Failed to release Wake Lock: ${err.name}, ${err.message}`);
            }
        }
    }

    handleVisibilityChange = () => {
        if (document.hidden) {
            // Release wake lock when the page is hidden
            this.releaseWakeLock();
        } else {
            // Request wake lock when the page becomes visible
            this.requestWakeLock();
        }
    }

    handleKeyDown = (event) => {
        const pitch = keyToPitch[event.key.toLowerCase()];
        if (pitch && !event.repeat) {
            const note = new MusicVisNote(pitch);
            this.addCurrentNote(note);
        }
    }

    handleKeyUp = (event) => {
        const pitch = keyToPitch[event.key.toLowerCase()];
        if (pitch) {
            this.removeCurrentNote(pitch);
        }
    }

    render() {
        const s = this.state;
        const notes = Array.from(s.currentNotes.values())
            .sort((a, b) => a.pitch - b.pitch);
        const chord2 = this.getChordName(notes);
        return (
            <div className={`App dark`} >
                <div className='chordInfo'>
                    <div>
                        {Array.from(notes)
                            .map(d => d.getName())
                            .join(' ')}
                    </div>
                    {/* <div>
                        Type: {chord.name}
                    </div> */}
                    <div>
                        Chord name: {chord2.join(', ')}
                    </div>
                </div>
                <div className='explanation'>
                    <span>
                        <FontAwesomeIcon icon={faInfoCircle} />&nbsp;
                        Connect a MIDI device and play some notes to see the chord type.
                    </span>
                </div>
                <div>
                    {s.challenge.length === 0
                        ? "Play a chord to select a scale"
                        : `Current challenge: ${s.challengeIndex + 1}/${s.challenge.length}`}
                </div>
                <PianoKeyboard
                    name='Piano Keyboard'
                    viewSize={s.viewSize}
                    theme='dark'
                    currentNotes={s.currentNotes}
                    expectedNotes={s.expectedNotes}
                    previouslyExpected={s.previouslyExpected}
                    challenge={s.challenge}
                    challengeIndex={s.challengeIndex}
                    incorrectNotes={s.incorrectNotes}
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
}
