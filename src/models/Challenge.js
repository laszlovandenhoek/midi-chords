export class Challenge {

    constructor(sequences, indexes, previouslyExpected, incorrectNotes, startTime, noteTimes) {
        this.sequences = sequences;
        this.indexes = indexes ?? new Array(sequences.length).fill(0);
        this.previouslyExpected = previouslyExpected ?? [];
        this.incorrectNotes = incorrectNotes ?? [];
        this.startTime = startTime ?? null;
        this.noteTimes = noteTimes ?? sequences.map(handSeq => 
            handSeq.map(chord => 
                new Array(chord.notes.length).fill(null)
            )
        );
    }

    fromSequences(challengeSequences) {
        return new Challenge(challengeSequences);
    }

    #with({
        sequences = this.sequences,
        indexes = this.indexes,
        previouslyExpected = this.previouslyExpected,
        incorrectNotes = this.incorrectNotes,
        startTime = this.startTime,
        noteTimes = this.noteTimes
    } = {}) {
        return new Challenge(
            sequences,
            indexes,
            previouslyExpected,
            incorrectNotes,
            startTime,
            noteTimes
        );
    }

    isFinished() {
        return this.indexes.every((index, hand) => index >= this.sequences[hand].length);
    }

    getCurrentExpectedNotes() {
        return this.sequences.flatMap((seq, hand) =>
            this.indexes[hand] < seq.length ? seq[this.indexes[hand]] : [])
            .flatMap(x => x.notes)
            .map(x => x.midi);
    }

    release(pitch) {
        let challenge = this.#with({
            previouslyExpected: this.previouslyExpected.filter(x => x !== pitch)
        });

        const expectedNotes = challenge.getCurrentExpectedNotes();

        if (expectedNotes.includes(pitch) && !this.previouslyExpected.includes(pitch)) {
            challenge = challenge.#with({
                incorrectNotes: [...this.incorrectNotes, pitch]
            });
        }

        return challenge;
    }

    tryAdvance(currentNotes) {
        const currentNotesMidi = Array.from(currentNotes.keys());

        const now = performance.now();

        let challenge = this;

        if (this.isFinished()) return challenge;

        // Get all expected notes across all hands
        const expectedNotes = [...this.previouslyExpected, ...this.getCurrentExpectedNotes()];

        if (currentNotes.size > 0) {
            if (this.startTime === null) {
                challenge = challenge.#with({
                    startTime: now
                });
            }

            // Create a deep copy of noteTimes
            const newNoteTimes = this.noteTimes.map(handTimes => 
                handTimes.map(chordTimes => [...chordTimes])
            );
            
            // Track timing for each note in its specific hand and chord context
            for (let hand = 0; hand < this.sequences.length; hand++) {
                if (this.indexes[hand] >= this.sequences[hand].length) continue;
                
                const expectedHandNotes = this.sequences[hand][this.indexes[hand]].notes.filter(x => !x.empty);
                expectedHandNotes.forEach((note, noteIndex) => {
                    if (currentNotesMidi.includes(note.midi)) {
                        newNoteTimes[hand][this.indexes[hand]][noteIndex] = now - challenge.startTime;
                    }
                });
            }

            challenge = challenge.#with({
                noteTimes: newNoteTimes
            });

            for (let hand = 0; hand < this.sequences.length; hand++) {
                if (this.indexes[hand] >= this.sequences[hand].length) continue;
                const expectedHandNotes = this.sequences[hand][this.indexes[hand]].notes.filter(x => !x.empty);

                if (
                    // all expected notes for this hand are pressed, and...
                    expectedHandNotes.every(note => currentNotesMidi.includes(note.midi)) &&
                    // all pressed notes are expected notes, either for this hand or any other hand
                    currentNotesMidi.every(note => expectedNotes.includes(note))
                ) {
                    const newIndexes = [...challenge.indexes];
                    newIndexes[hand] = challenge.indexes[hand] + 1;

                    challenge = challenge.#with({
                        previouslyExpected: [...challenge.previouslyExpected, ...expectedHandNotes.map(x => x.midi)],
                        indexes: newIndexes
                    });
                } else {
                    // get all notes that are pressed but not expected
                    const theChallenge = challenge; //for the closure
                    const incorrectNotes = currentNotesMidi
                        .filter(note => !expectedNotes.includes(note))
                        .filter(note => !theChallenge.previouslyExpected.includes(note));

                    challenge = challenge.#with({
                        incorrectNotes: [...challenge.incorrectNotes, ...incorrectNotes],
                    });
                }
            }
        }

        return challenge;
    }

    getProgressReport() {
        if (!this.startTime) return "Challenge not started";
        
        let report = [];
        
        this.sequences.forEach((handSeq, hand) => {
            report.push(`Hand ${hand}:`);
            handSeq.forEach((chord, chordIndex) => {
                const isCurrentChord = this.indexes[hand] === chordIndex;
                const isCompleted = this.indexes[hand] > chordIndex;
                
                const chordNotes = chord.notes.map((note, noteIndex) => {
                    if (note.empty) return 'x';
                    const timing = this.noteTimes[hand][chordIndex][noteIndex];
                    return timing !== null ? 
                        `${note.midi}(${timing.toFixed(0)}ms)` : 
                        note.midi.toString();
                }).join(', ');
                
                const status = isCurrentChord ? '→ ' : 
                              isCompleted ? '✓ ' : 
                              '  ';
                              
                report.push(`  ${status}Chord ${chordIndex}: [${chordNotes}]`);
            });
        });
        
        if (this.incorrectNotes.length > 0) {
            report.push(`Incorrect notes: ${this.incorrectNotes.join(', ')}`);
        }
        
        return report.join('\n');
    }
} 