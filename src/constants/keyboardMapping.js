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

export const keyToPitch = { ...keyToPitchNoShift, ...keyToPitchWithShift };

// Create a reverse mapping from pitch to key(s)
const pitchToKey = Object.entries(keyToPitch).reduce((acc, [key, pitch]) => {
    if (!acc[pitch]) {
        acc[pitch] = [];
    }
    acc[pitch].push(key);
    return acc;
}, {});

export { pitchToKey }; 