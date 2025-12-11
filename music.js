// Audio setup for Christmas music - "All I Want for Christmas is You"
let audioContext;
let isPlaying = false;

// Tempo: 120 BPM (beats per minute)
// At 120 BPM: quarter note = 0.5s, eighth note = 0.25s, sixteenth note = 0.125s
const TEMPO = 120;
const QUARTER_NOTE = 60 / TEMPO; // 0.5 seconds
const EIGHTH_NOTE = QUARTER_NOTE / 2; // 0.25 seconds
const SIXTEENTH_NOTE = QUARTER_NOTE / 4; // 0.125 seconds
const HALF_NOTE = QUARTER_NOTE * 2; // 1.0 seconds
const DOTTED_EIGHTH = EIGHTH_NOTE * 1.5; // 0.375 seconds
const DOTTED_QUARTER = QUARTER_NOTE * 1.5; // 0.75 seconds

// Note frequencies (in Hz)
const notes = {
    C4: 261.63,
    C4s: 277.18, // C#
    D4: 293.66,
    D4s: 311.13, // D#
    E4: 329.63,
    F4: 349.23,
    F4s: 369.99, // F#
    G4: 392.00,
    G4s: 415.30, // G#
    A4: 440.00,
    A4s: 466.16, // A# / Bb
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    D5s: 622.25, // D#5
    E5: 659.25,
    F5: 698.46,
    F5s: 739.99, // F#5
    G5: 783.99,
    A5: 880.00
};

// Accurate melody transcription with proper musical timing
// Based on provided chord progression at 120 BPM
const melody = [
    // "I don't want a lot for Christmas" - .G .B D F# G F# E-D
    // Syncopated pickup notes (sixteenth notes), then eighth notes
    { note: notes.G4, duration: SIXTEENTH_NOTE }, { note: notes.B4, duration: SIXTEENTH_NOTE },
    { note: notes.D4, duration: EIGHTH_NOTE }, { note: notes.F4s, duration: EIGHTH_NOTE },
    { note: notes.G4, duration: EIGHTH_NOTE }, { note: notes.F4s, duration: EIGHTH_NOTE },
    { note: notes.E4, duration: EIGHTH_NOTE }, { note: notes.D4, duration: DOTTED_QUARTER },
    
    // Rest between phrases
    { note: 0, duration: EIGHTH_NOTE },
    
    // "There is just one thing I need" - A G G F# G F# E-D
    { note: notes.A4, duration: EIGHTH_NOTE }, { note: notes.G4, duration: SIXTEENTH_NOTE },
    { note: notes.G4, duration: SIXTEENTH_NOTE }, { note: notes.F4s, duration: EIGHTH_NOTE },
    { note: notes.G4, duration: EIGHTH_NOTE }, { note: notes.F4s, duration: EIGHTH_NOTE },
    { note: notes.E4, duration: EIGHTH_NOTE }, { note: notes.D4, duration: DOTTED_QUARTER },
    
    // Rest between phrases
    { note: 0, duration: EIGHTH_NOTE },
    
    // "I don't care about the presents" - C E G A-Bb A G-E
    { note: notes.C4, duration: EIGHTH_NOTE }, { note: notes.E4, duration: EIGHTH_NOTE },
    { note: notes.G4, duration: EIGHTH_NOTE }, { note: notes.A4, duration: SIXTEENTH_NOTE },
    { note: notes.A4s, duration: SIXTEENTH_NOTE }, { note: notes.A4, duration: EIGHTH_NOTE },
    { note: notes.G4, duration: SIXTEENTH_NOTE }, { note: notes.E4, duration: DOTTED_QUARTER },
    
    // Rest between phrases
    { note: 0, duration: EIGHTH_NOTE },
    
    // "Underneath the Christmas tree" - C - D# - G A Bb - A F-D#
    // Longer notes (quarter notes) for the held notes
    { note: notes.C4, duration: QUARTER_NOTE }, { note: notes.D4s, duration: QUARTER_NOTE },
    { note: notes.G4, duration: EIGHTH_NOTE }, { note: notes.A4, duration: EIGHTH_NOTE },
    { note: notes.A4s, duration: SIXTEENTH_NOTE }, { note: notes.A4, duration: EIGHTH_NOTE },
    { note: notes.F4, duration: SIXTEENTH_NOTE }, { note: notes.D4s, duration: DOTTED_QUARTER },
    
    // Rest between phrases
    { note: 0, duration: QUARTER_NOTE },
    
    // "I just want you for my own" - G A F# G E F# E-D#
    { note: notes.G4, duration: EIGHTH_NOTE }, { note: notes.A4, duration: EIGHTH_NOTE },
    { note: notes.F4s, duration: EIGHTH_NOTE }, { note: notes.G4, duration: EIGHTH_NOTE },
    { note: notes.E4, duration: EIGHTH_NOTE }, { note: notes.F4s, duration: EIGHTH_NOTE },
    { note: notes.E4, duration: EIGHTH_NOTE }, { note: notes.D4s, duration: DOTTED_QUARTER },
    
    // Rest between phrases
    { note: 0, duration: EIGHTH_NOTE },
    
    // "More than you could ever know" - B A G F# E-F# E-D#
    { note: notes.B4, duration: DOTTED_EIGHTH }, { note: notes.A4, duration: EIGHTH_NOTE },
    { note: notes.G4, duration: EIGHTH_NOTE }, { note: notes.F4s, duration: EIGHTH_NOTE },
    { note: notes.E4, duration: SIXTEENTH_NOTE }, { note: notes.F4s, duration: SIXTEENTH_NOTE },
    { note: notes.E4, duration: EIGHTH_NOTE }, { note: notes.D4s, duration: DOTTED_QUARTER },
    
    // Rest between phrases
    { note: 0, duration: EIGHTH_NOTE },
    
    // "Make my wish come true" - D E G ^D ^C
    { note: notes.D4, duration: EIGHTH_NOTE }, { note: notes.E4, duration: EIGHTH_NOTE },
    { note: notes.G4, duration: DOTTED_EIGHTH }, { note: notes.D5, duration: DOTTED_EIGHTH },
    { note: notes.C5, duration: HALF_NOTE },
    
    // Rest before final phrase
    { note: 0, duration: EIGHTH_NOTE },
    
    // "All I want for Christmas is you!" - B A G E D# - A B A-G
    { note: notes.B4, duration: SIXTEENTH_NOTE }, { note: notes.A4, duration: EIGHTH_NOTE },
    { note: notes.G4, duration: EIGHTH_NOTE }, { note: notes.E4, duration: EIGHTH_NOTE },
    { note: notes.D4s, duration: SIXTEENTH_NOTE }, { note: notes.A4, duration: EIGHTH_NOTE },
    { note: notes.B4, duration: EIGHTH_NOTE }, { note: notes.A4, duration: SIXTEENTH_NOTE },
    { note: notes.G4, duration: HALF_NOTE + QUARTER_NOTE }, // Hold the final note longer
    
    // Longer pause before loop
    { note: 0, duration: QUARTER_NOTE }
];

// Play a single note with chiptune-style sound
function playNote(frequency, duration, startTime) {
    if (!audioContext || frequency === 0) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Chiptune-style: square wave for that retro game sound
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    
    // Envelope for smoother sound
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

// Play the melody
function playMelody() {
    if (!audioContext || isPlaying) return;
    
    isPlaying = true;
    let currentTime = audioContext.currentTime;
    
    melody.forEach((noteData) => {
        if (noteData.note > 0) {
            playNote(noteData.note, noteData.duration, currentTime);
        }
        // No extra gap - rests are already in the melody array
        currentTime += noteData.duration;
    });
    
    // Loop the melody
    const totalDuration = melody.reduce((sum, n) => sum + n.duration, 0);
    setTimeout(() => {
        isPlaying = false;
        if (audioContext) {
            playMelody();
        }
    }, totalDuration * 1000);
}

// Initialize audio (requires user interaction)
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        playMelody();
    } catch (e) {
        console.log('Audio not supported:', e);
    }
}

// Start audio on first user interaction
let audioInitialized = false;
document.addEventListener('click', () => {
    if (!audioInitialized) {
        initAudio();
        audioInitialized = true;
    }
}, { once: true });

document.addEventListener('keydown', () => {
    if (!audioInitialized) {
        initAudio();
        audioInitialized = true;
    }
}, { once: true });

