const assert = require('assert')
const test = require('node:test')
const {
  parseChordProgressionToNotesArray,
  openAiFetchChordRequest,
} = require('./utils')

test('parseChordProgressionToNotesArray', async (t) => {
  const mockChordResponse = {
    tempo: 120,
    chords: [
      {
        chord: 'Cmaj7',
        start: 0,
        duration: 4,
        notes: ['C4', 'E4', 'G4', 'B4'],
      },
      {
        chord: 'Am7',
        start: 4,
        duration: 2,
        notes: ['A3', 'C4', 'E4', 'G4'],
      },
    ],
  }

  const result = parseChordProgressionToNotesArray(mockChordResponse)

  assert.strictEqual(result.length, 8) // 4 notes in each chord

  // Test the first note of the first chord
  assert.deepStrictEqual(result[0], {
    note_id: 0,
    pitch: 60, // C4
    start_time: 0,
    duration: 4, // 4 / 4
    velocity: 100,
    mute: 0,
    probability: 1,
    velocity_deviation: 0,
    release_velocity: 100,
  })

  // Test the first note of the second chord
  assert.deepStrictEqual(result[4], {
    note_id: 0,
    pitch: 57, // A3
    start_time: 4,
    duration: 2, // 2 / 4
    velocity: 100,
    mute: 0,
    probability: 1,
    velocity_deviation: 0,
    release_velocity: 100,
  })
})

test('ai should return a chord progression', async (t) => {
  const result = await openAiFetchChordRequest({
    message: 'Give me a I V vi IV progression',
    bpm: 120,
    key: 'C',
  })

  assert.ok(result)
  assert.strictEqual(result.tempo, 120)
  assert.strictEqual(result.chords.length, 4)

  // Check that the chord string starts with C
  assert.ok(result.chords[0].chord.startsWith('C'))
  // Check that the notes are ['C4', 'E4', 'G4']
  assert.deepStrictEqual(result.chords[0].notes, ['C4', 'E4', 'G4'])

  assert.ok(result.chords[1].chord.startsWith('G'))
  assert.deepStrictEqual(result.chords[1].notes, ['G4', 'B4', 'D5'])
  assert.ok(result.chords[2].chord.startsWith('A'))
  assert.deepStrictEqual(result.chords[2].notes, ['A4', 'C5', 'E5'])
  assert.ok(result.chords[3].chord.startsWith('F'))
  assert.deepStrictEqual(result.chords[3].notes, ['F4', 'A4', 'C5'])
})

test('ai should return a chord progression with extended chords', async (t) => {
  const result = await openAiFetchChordRequest({
    message: 'Give me a I V vi IV progression with extended chords',
    bpm: 120,
    key: 'C',
  })

  assert.ok(result)
  assert.strictEqual(result.tempo, 120)
  assert.strictEqual(result.chords.length, 4)

  // Check that there are at least 4 notes in each chord
  result.chords.forEach((chord) => {
    assert.ok(chord.notes.length >= 4)
  })

  // Check that the chord string starts with C
  assert.ok(result.chords[0].chord.startsWith('C'))
  assert.ok(result.chords[1].chord.startsWith('G'))
  assert.ok(result.chords[2].chord.startsWith('A'))
  assert.ok(result.chords[3].chord.startsWith('F'))
})

test('ai should return a chord progression with a minor progression', async (t) => {
  const result = await openAiFetchChordRequest({
    message: 'Give me a minor 2 5 1 with extended chords',
    bpm: 120,
    key: 'E minor',
  })

  assert.ok(result)
  assert.strictEqual(result.tempo, 120)
  assert.strictEqual(result.chords.length, 3)

  // Check that the chord string starts with F
  assert.ok(result.chords[0].chord.startsWith('F#'))
  assert.ok(result.chords[1].chord.startsWith('B'))
  assert.ok(result.chords[2].chord.startsWith('E'))
})

test('ai should return a chord progression with seventh chords', async (t) => {
  const result = await openAiFetchChordRequest({
    message: 'Give me a VI VII i with seventh chords',
    bpm: 120,
    key: 'A minor',
  })

  assert.ok(result)
  assert.strictEqual(result.tempo, 120)
  assert.strictEqual(result.chords.length, 3)

  // F major seventh
  const firstChord = result.chords[0]
  assert.ok(firstChord.chord.startsWith('F'))
  assert.ok(firstChord.notes[0].startsWith('F'))
  assert.ok(firstChord.notes[1].startsWith('A'))
  assert.ok(firstChord.notes[2].startsWith('C'))
  assert.ok(firstChord.notes[3].startsWith('E'))

  // G major seventh
  const secondChord = result.chords[1]
  assert.ok(secondChord.chord.startsWith('G'))
  assert.ok(secondChord.notes[0].startsWith('G'))
  assert.ok(secondChord.notes[1].startsWith('B'))
  assert.ok(secondChord.notes[2].startsWith('D'))
  assert.ok(secondChord.notes[3].startsWith('F'))

  // A minor seventh
  const thirdChord = result.chords[2]
  assert.ok(thirdChord.chord.startsWith('A'))
  assert.ok(thirdChord.notes[0].startsWith('A'))
  assert.ok(thirdChord.notes[1].startsWith('C'))
  assert.ok(thirdChord.notes[2].startsWith('E'))
  assert.ok(thirdChord.notes[3].startsWith('G'))
})
