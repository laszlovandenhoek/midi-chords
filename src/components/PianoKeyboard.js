import { Piano } from 'musicvis-lib';
import React from 'react';
import { Note as TonalNote } from "tonal";
import View from '../lib/ui/View';
import { KeyState } from '../types/KeyState';
import { pitchToKey } from '../constants/keyboardMapping';

// Define a native range function
function range(start, end) {
    return Array.from({ length: end - start }, (_, i) => start + i);
}

export default class PianoKeyboard extends View {
    constructor(props) {
        const margin = { top: 20, right: 20, bottom: 40, left: 20 };
        super(props, margin, 1, 1, false, false);
    }

    componentDidUpdate = () => this.resizeComponent();

    getKeyColor(pitch, black) {
        const keyState = this.props.currentNotes.get(pitch);
        
        switch (keyState) {
            case KeyState.Down:
                return 'steelblue';
            case KeyState.Good:
                return 'limegreen';
            case KeyState.Bad:
                return 'red';
            case KeyState.Mistake:
                return 'pink';
            case KeyState.Done:
                return 'palegreen';
            case KeyState.Next:
                return 'darkgreen';
            default:
                return black ? '#222' : '#f8f8f8';
        }
    }

    getTextColor(pitch, black) {
        const keyState = this.props.currentNotes.get(pitch);
        if (keyState === KeyState.Next) {
            return '#eee';
        }
        return black ? '#eee' : '#222';
    }

    render() {
        const { rowSpan, columnSpan, viewWidth, viewHeight, width, height, margin } = this.state;
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

                color = this.getKeyColor(pitch, black);
                textColor = this.getTextColor(pitch, black);

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
                    <g key={pitch}>
                        {/* Keyboard mapping letter(s) */}
                        {pitchToKey[pitch] && pitchToKey[pitch].map((key, i) => (
                            <g key={key} transform={`translate(${x + 0.5 * w + (i - pitchToKey[pitch].length/2 + 0.5) * 17}, ${black ? h - 42 : h - 37})`}>
                                {/* Key background */}
                                <rect
                                    width="16"
                                    height="16"
                                    x="-8"
                                    y="-8"
                                    rx="2"
                                    ry="2"
                                    fill="#e0e0e0"
                                    stroke="#888"
                                    strokeWidth="0.5"
                                />
                                {/* Key letter */}
                                <text
                                    fontSize='8px'
                                    style={{
                                        fill: '#222',
                                        textAnchor: 'middle',
                                        alignmentBaseline: 'middle',
                                        userSelect: 'none'
                                    }}
                                    x="0"
                                    y="0"
                                >
                                    {key}
                                </text>
                            </g>
                        ))}
                        {/* Note name */}
                        <text
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
                    </g>
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
