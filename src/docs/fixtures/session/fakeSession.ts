/** Rust-validated command/time snapshots. This fixture deliberately has no
 * second playback authority or invented controller lease. Hosts send commands
 * to their server; this docs adapter only steps through committed examples. */
import vectors from './golden.json'
export class SessionFixture {
  index = -1
  get state() { return structuredClone(this.index < 0 ? vectors.initial : vectors.steps[this.index]!.expected) }
  get step() { return this.index < 0 ? null : vectors.steps[this.index]! }
  advance() { this.index = Math.min(this.index + 1, vectors.steps.length - 1); return this.state }
  reset() { this.index = -1; return this.state }
}
