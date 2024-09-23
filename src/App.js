import React, { Component } from 'react';
import './style/App.css';
// Views
import PianoKeyboard from './components/PianoKeyboard';
import { Chord } from "tonal";
import { MidiInputManager } from 'musicvis-lib';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

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
    }

    componentWillUnmount() {
        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('focus', this.requestWakeLock);

        // Release wake lock when component unmounts
        this.releaseWakeLock();
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
        this.setState({ currentNotes: newMap });
    }
    
    getChordName(notes) {
        const noteLetters = notes.map(d => d.getLetter());
        return Chord.detect(noteLetters);
    }

    /**
     * Removes a currently played note (e.g. keyboard key no longer pressed)
     * @param {number} pitch pitch of the note to remove
     */
    removeCurrentNote = (pitch) => {
        const newMap = new Map(this.state.currentNotes);
        newMap.delete(pitch);
        this.setState({ currentNotes: newMap });
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
                <PianoKeyboard
                    name='Piano Keyboard'
                    viewSize={s.viewSize}
                    theme='dark'
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
