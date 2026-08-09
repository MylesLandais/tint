/**
 * Primitives shared by every media surface: the scrubber, volume control,
 * timecode formatter, canvas waveform, and white-label artwork placeholder
 * that `MediaPlayer` (`../media-player`) composes into one unified surface.
 */
export { Slider, type SliderProps } from './Slider'
export { VolumeControl, type VolumeControlProps } from './VolumeControl'
export { formatTime } from './formatTime'
export { Waveform, type WaveformProps } from './Waveform'
export { MediaPlaceholder, type MediaPlaceholderProps } from './MediaPlaceholder'
