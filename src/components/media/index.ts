/**
 * Primitives shared by every media surface.
 *
 * These began inside `video-player/`; `AudioPlayer` needs the same scrubber,
 * volume control, and timecode formatter, so they live here rather than being
 * reimplemented or imported across component boundaries.
 */
export { Slider, type SliderProps } from './Slider'
export { VolumeControl, type VolumeControlProps } from './VolumeControl'
export { formatTime } from './formatTime'
