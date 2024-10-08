require('dotenv').config()
const Midi = require('@tonaljs/midi')
const Note = require('@tonaljs/note')

const openAiKey = process.env.OPENAI_API_KEY

/**
 * @typedef {Object} Note
 * @property {number} note_id - An integer identifier for the note
 * @property {number} pitch - An integer representing the pitch, ranging from 0 to 127
 * @property {number} start_time - A float representing the start time of the note
 * @property {number} duration - A float representing the duration of the note
 * @property {number} velocity - An integer representing the velocity, ranging from 1 to 127
 * @property {number} mute - A boolean-like integer (0 or 1) indicating whether the note is muted
 * @property {number} probability - A float representing the probability, ranging from 0 to 1
 * @property {number} velocity_deviation - An integer representing velocity deviation, ranging from -127 to 127
 * @property {number} release_velocity - An integer representing release velocity, ranging from 1 to 127
 */

/**
 * @typedef {Object} ChordResponse
 * @property {number} tempo - The tempo of the chord progression
 * @property {Array<{
 *  chord: string,
 *  start: number,
 *  duration: number,
 *  notes: Array<string>
 * }>} chords - The chords in the chord progression
 */

/**
 * @param {Object} props
 * @param {string} props.message - The message to generate a chord progression for
 * @param {number} props.bpm - The tempo of the chord progression
 * @param {string} props.key - The key of the chord progression
 * @returns {Promise<ChordResponse>}
 */
async function openAiFetchChordRequest({
  message,
  bpm = 120,
  key = undefined,
}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a music AI for generating interesting chord progressions.
          Output the chords with their note durations in JSON format, suitable for creating MIDI data.
          Don't default to C major, use the key if provided.
          Each chord should be represented as an object with the following fields:
            •	chord: The chord name (e.g., 'Cmaj7', 'Am9').
            •	start: The start time in beats.
            •	duration: The duration in beats.
            •	notes: An array of the individual notes in the chord (e.g., ['C4', 'E4', 'G4']).
            Include the tempo at the beginning of the JSON output. The tempo is ${bpm} BPM. Ensure the JSON is properly formatted. Only output the JSON in plain text, don't wrap it in a markdown code block or any other formatting.`,
        },
        {
          role: 'user',
          content: `Generate a chord progression based on the following instructions: ${message}. ${
            key ? `In the key of ${key}` : ''
          }.`,
        },
      ],
      temperature: 0.5,
    }),
  })

  const data = await response.json()
  const textResponse = data.choices[0].message.content

  console.log(textResponse)

  const jsonResponse = JSON.parse(textResponse)

  /** Expected JSON response
    {
      "tempo": 128,
      "chords": [
        {
          "chord": "Cmaj7",
          "start": 0,
          "duration": 4,
          "notes": ["C4", "E4", "G4", "B4"]
        },
        {
          "chord": "Am7",
          "start": 4,
          "duration": 4,
          "notes": ["A3", "C4", "E4", "G4"]
        },
        {
          "chord": "Fmaj7",
          "start": 8,
          "duration": 4,
          "notes": ["F3", "A3", "C4", "E4"]
        },
        {
          "chord": "G7",
          "start": 12,
          "duration": 4,
          "notes": ["G3", "B3", "D4", "F4"]
        }
      ]
    }
   */

  return jsonResponse
}

/**
 * @param {ChordResponse} chordResponseJson
 * @returns {Array<Note>}
 */
function parseChordProgressionToNotesArray(chordResponseJson) {
  const rootMidi = 56
  const rootNote = Note.get(Note.fromMidi(rootMidi))
  const durationMultiplier = 1 // The durations in the responses seem to come in too fast
  /**
   * @type {Array<Note>}
   */
  const notesArr = chordResponseJson.chords.flatMap((chord, index) => {
    const { notes, duration, start } = chord

    return notes.map((note, index) => {
      const pitch = Midi.toMidi(note)
      // start_time is the index of the chord times 1 measure

      /** @type {Note} */
      const noteObj = {
        note_id: index,
        pitch: pitch,
        start_time: start * durationMultiplier,
        duration: duration * durationMultiplier,
        velocity: 100,
        mute: 0,
        probability: 1,
        velocity_deviation: 0,
        release_velocity: 100,
      }
      return noteObj
    })
  })

  return notesArr
}

async function requestChordProgression(message) {
  const chordResponseJson = await openAiFetchChordRequest({ message })
  const chords = chordResponseJson.chords
  const notes = parseChordProgressionToNotesArray(chordResponseJson)

  return { notes, chords }
}

module.exports = {
  openAiFetchChordRequest,
  requestChordProgression,
  parseChordProgressionToNotesArray,
}
