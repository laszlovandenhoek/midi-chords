import React from 'react';
import View from '../lib/ui/View';
import { MidiInputManager, Piano, Note as MusicVisNote } from 'musicvis-lib';
import { Scale, Note as TonalNote, Midi as TonalMidi } from "tonal";

// Define a native range function
function range(start, end) {
    return Array.from({ length: end - start }, (_, i) => start + i);
}

const keyToPitch = {
    'a': 21, 'w': 22, 's': 23, 'd': 24, 'r': 25, 'f': 26, 't': 27,
    'g': 28, 'h': 29, 'u': 30, 'j': 31, 'i': 32, 'k': 33, 'o': 34,
    'l': 35, ';': 36, '[': 37
};

export default class PianoKeyboard extends View {

    constructor(props) {
        const margin = { top: 20, right: 20, bottom: 40, left: 20 };
        super(props, margin, 1, 1, false, false);
        new MidiInputManager(
            this.getMidiLiveData,
            this.setMidiLiveData,
            this.addCurrentNote,
            this.removeCurrentNote
        );
        this.state = {
            ...this.state,
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
    }

    componentDidMount() {
        // Add key event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    componentWillUnmount() {
        // Remove key event listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
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

    componentDidUpdate = () => this.resizeComponent();

    // Challenge-related methods
    addCurrentNote = (note) => {
        const newMap = new Map(this.state.currentNotes);
        newMap.set(note.pitch, note);

        // Challenge is active
        if (this.state.challenge.length > 0) {
            if (this.checkCancelKeys(newMap)) {
                this.setState({
                    currentNotes: newMap,
                }, this.resetChallenge);
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
            } else {
                this.setState(prevState => ({
                    currentNotes: newMap,
                    incorrectNotes: new Set(prevState.incorrectNotes).add(note.pitch),
                }));
            }
        
        // Challenge is not active
        } else {
            this.setState(prevState => ({
                currentNotes: newMap,
                incorrectNotes: new Set(),
                candidateNotesForChallenge: [...prevState.candidateNotesForChallenge, note.pitch]
            }));
        }
    }

    removeCurrentNote = (pitch) => {
        const newMap = new Map(this.state.currentNotes);
        newMap.delete(pitch);

        this.setState(prevState => ({
            currentNotes: newMap,
            previouslyExpected: prevState.previouslyExpected.filter(p => p !== pitch)
        }), this.checkChallenge);

        if (this.state.challenge.length === 0 && newMap.size === 0) {
            this.setNewChallenge();
        }
    }

    setNewChallenge = () => {
        if (this.state.candidateNotesForChallenge.length === 1) {
            const pitch = this.state.candidateNotesForChallenge[0];

            const note = TonalNote.get(TonalNote.fromMidi(pitch));

            const { minPitch, maxPitch } = Piano.pianoPitchRange.get(88);
            const minNote = TonalNote.get(TonalNote.fromMidi(minPitch));
            const maxNote = TonalNote.get(TonalNote.fromMidi(maxPitch));

            const scale = Scale.rangeOf(`${note.pc} major`)(minNote.name, maxNote.name);

            const startIndex = scale.findIndex(n => TonalNote.get(n).letter === note.letter);
            const endIndex = scale.slice().reverse().findIndex(n => TonalNote.get(n).letter === note.letter);
            const largestSlice = scale.slice(startIndex, scale.length - endIndex);

            let exercisePattern = [];

            for (let n of largestSlice) {
                n = TonalMidi.toMidi(n);
                exercisePattern.push([n]);
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
                expectedNotes: challenge[prevState.challengeIndex + 1],
            }));
        } else {
            this.resetChallenge();
        }
    }

    checkCancelKeys = (currentNotes) => {
        const cancelKeys = [21, 22]; // A0 + A#0
        return cancelKeys.length === currentNotes.size && cancelKeys.every(key => currentNotes.has(key));
    }

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

    render() {
        const { rowSpan, columnSpan, viewWidth, viewHeight, width, height, margin,
            currentNotes, expectedNotes, previouslyExpected, challenge, challengeIndex, incorrectNotes } = this.state;
        const { minPitch, maxPitch } = Piano.pianoPitchRange.get(88);
        const whiteNotes = range(minPitch, maxPitch + 1)
            .map(TonalNote.fromMidi)
            .map(TonalNote.get)
            .filter(d => d.acc === '');
        // Keys
        const keyWidth = width / whiteNotes.length;
        const blackKeyWidth = keyWidth * 0.9;
        const whiteKeys = [];
        const blackKeys = [];
        const labels = [];
        const octaveMarkerPositions = [];
        let currentX = 0;
        for (let octave = -1; octave < 11; octave++) {
            for (let key = 0; key < 12; key++) {
                const pitch = octave * 12 + key;
                if (pitch < minPitch || pitch > maxPitch) {
                    continue;
                }

                const note = TonalNote.get(TonalNote.fromMidiSharps(pitch));
                const black = note.acc !== '';
                // Position and size
                const x = black ? currentX - (0.5 * blackKeyWidth) : currentX;
                let y = black ? 0 : height * 0.02;
                const w = black ? blackKeyWidth : keyWidth;
                const h = black ? height * 0.6 : height * 0.98;
                if (pitch % 12 === 0) {
                    octaveMarkerPositions.push({ octave, x });
                }
                // Colors
                let color, textColor;
                let borderRadius = 5;
                const hasExpectation = expectedNotes.length > 0;
                const pitchExpected = expectedNotes.includes(pitch);
                const pitchPlayed = currentNotes.has(pitch);
                const isCompleted = challenge.length > 0 && challenge.slice(0, challengeIndex).flat().includes(pitch);
                const isIncorrect = incorrectNotes.has(pitch);

                if (!hasExpectation && pitchPlayed) {
                    color = 'steelblue';
                    textColor = '#111';
                } else if (pitchExpected && pitchPlayed) {
                    color = 'limegreen';
                    textColor = '#111';
                } else if (!pitchExpected && pitchPlayed) {
                    color = previouslyExpected.includes(pitch) ? 'palegreen' : 'pink';
                    textColor = '#111';
                } else if (pitchExpected && !pitchPlayed) {
                    color = 'darkgreen';
                    textColor = '#eee';
                } else if (isIncorrect) {
                    color = 'red';
                    textColor = '#111';
                } else if (isCompleted) {
                    color = 'limegreen';
                    textColor = '#111';
                } else {
                    color = black ? '#222' : '#f8f8f8';
                    textColor = black ? '#eee' : '#222';
                }
                const newKey = (
                    <rect
                        key={pitch}
                        width={w}
                        height={h}
                        x={x}
                        y={y}
                        rx={borderRadius}
                        ry={borderRadius}
                        fill={color}
                        stroke='#888'
                        strokeWidth='0.5'
                    >
                        <title>
                            {note.name} (MIDI {pitch})
                        </title>
                    </rect>
                );
                labels.push((
                    <text
                        key={pitch}
                        fontSize='10px'
                        style={{
                            fill: textColor,
                            textAnchor: 'middle',
                            alignmentBaseline: 'baseline',
                            writingMode: 'vertical-lr',
                            textOrientation: 'upright'
                        }}
                        x={x + 0.5 * w}
                        y={black ? h - 18 : h - 10}
                    >
                        {note.pc}
                    </text>
                ));
                if (black) {
                    blackKeys.push(newKey);
                } else {
                    whiteKeys.push(newKey);
                    currentX += keyWidth;
                }
            }
        }
        // Octave indicators
        const octaveMarkers = [];
        const octaveMarkerLabels = [];
        const yPos = height + 15;
        for (let i = 0; i < octaveMarkerPositions.length - 1; i++) {
            const left = octaveMarkerPositions[i].x + 2;
            const right = octaveMarkerPositions[i + 1].x - 2;
            const d = `
                M ${left} ${yPos - 10}
                L ${left} ${yPos}
                L ${right} ${yPos}
                L ${right} ${yPos - 10}
            `;
            octaveMarkers.push((
                <path
                    key={d}
                    fill='none'
                    stroke='#888'
                    d={d}
                />
            ));
            octaveMarkerLabels.push((
                <text
                    key={d}
                    textAnchor='middle'
                    x={(left + right) / 2}
                    y={yPos + 12}
                >
                    Octave {octaveMarkerPositions[i].octave - 1}
                </text>
            ));
        }
        // HTML
        return (
            <div>
                <div>
                    {challenge.length === 0
                        ? "Play a chord to select a scale"
                        : `Current challenge: ${challengeIndex + 1}/${challenge.length}`}
                </div>
                <div
                    className='View PianoKeyboard'
                    style={{ gridArea: `span ${rowSpan} / span ${columnSpan}` }}
                >
                    <svg
                        width={viewWidth}
                        height={viewHeight}
                    >
                        <g
                            ref={n => this.svg = n}
                            transform={`translate(${margin.left}, ${margin.top})`}
                        >
                            {whiteKeys}
                            {blackKeys}
                            {labels}
                            {octaveMarkers}
                            {octaveMarkerLabels}
                        </g>
                    </svg>
                </div >
            </div>
        );
    }
}
