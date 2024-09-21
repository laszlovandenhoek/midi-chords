import React from 'react';
import { range } from 'd3-array';
import View from '../lib/ui/View';
import { Midi, Piano } from 'musicvis-lib';

export default class PianoKeyboard extends View {

    constructor(props) {
        const margin = { top: 20, right: 20, bottom: 40, left: 20 };
        super(props, margin, 1, 1, false, false);
    }

    componentDidUpdate = () => this.resizeComponent();

    render() {
        const { rowSpan, columnSpan, viewWidth, viewHeight, width, height, margin } = this.state;
        const { currentNotes, expectedNotes, previouslyExpected, challenge, challengeIndex, incorrectNotes } = this.props;
        const { minPitch, maxPitch } = Piano.pianoPitchRange.get(88);
        const whiteNotes = range(minPitch, maxPitch + 1).filter(d => !Midi.isSharp(d));
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
                const black = Midi.isSharp(pitch);
                const note = Midi.getMidiNoteByNr(pitch);
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

                if (!hasExpectation || (!pitchExpected && !pitchPlayed && !isCompleted && !isIncorrect)) {
                    color = pitchPlayed ? 'steelblue' : (black ? '#222' : '#f8f8f8');
                    textColor = pitchPlayed ? '#111' : (black ? '#eee' : '#222');
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
                            {note.label} (MIDI {pitch})
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
                        {note.name}
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
        );
    }
}
