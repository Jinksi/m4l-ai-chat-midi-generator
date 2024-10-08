const path = require('path')
const Max = require('max-api')
const { requestChordProgression } = require('./src/utils')

// This will be printed directly to the Max console
Max.post(`Loaded the ${path.basename(__filename)} script`)

Max.addHandler('fetchRequest', async (message) => {
  const { notes, chords } = await requestChordProgression(message)
  // Max.post(notes)
  const chordNamesString = chords.map((chord) => chord.chord).join(' ')

  try {
    await Max.setDict('notes', { notes })
    await Max.setDict('chordNames', { chordNamesString })
  } catch (error) {
    Max.post(error)
  }
  Max.outlet('bang')
})
