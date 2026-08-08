import type { AudioTranscriber, TranscriptChunk } from '../../components/audio-input'

type SpeechRecognitionResultEvent = Event & {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: Event & { error?: string }) => void) | null
  onend: (() => void) | null
  start: (track?: MediaStreamTrack) => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function constructorForSpeech() {
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition
}

export function createWebSpeechTranscriber(language = 'en-US'): AudioTranscriber {
  const listeners = new Set<(chunk: TranscriptChunk) => void>()
  const errors = new Set<(error: Error) => void>()
  let recognition: SpeechRecognitionLike | undefined
  let finishStop: (() => void) | undefined

  return {
    start(stream) {
      const Constructor = constructorForSpeech()
      if (!Constructor) throw new Error('Web Speech recognition is unavailable in this browser.')
      recognition = new Constructor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language
      recognition.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index]
          listeners.forEach((listener) => listener({ text: result[0].transcript, isFinal: result.isFinal }))
        }
      }
      recognition.onerror = (event) => {
        errors.forEach((listener) => listener(new Error(event.error || 'Speech recognition failed.')))
      }
      recognition.onend = () => {
        finishStop?.()
        finishStop = undefined
      }
      const track = stream.getAudioTracks()[0]
      if (!track) throw new Error('No live microphone track was available.')
      recognition.start(track)
    },
    stop() {
      if (!recognition) return
      return new Promise<void>((resolve) => {
        finishStop = resolve
        recognition?.stop()
      })
    },
    cancel() {
      finishStop = undefined
      recognition?.abort()
      recognition = undefined
    },
    onResult(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    onError(listener) {
      errors.add(listener)
      return () => errors.delete(listener)
    },
  }
}
