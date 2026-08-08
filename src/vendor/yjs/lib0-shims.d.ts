/**
 * lib0 is inlined into `index.js`. These ambient modules exist only so the
 * vendored `.d.ts` tree typechecks — they are not a runtime dependency.
 */

declare module 'lib0/observable' {
  export class ObservableV2<
    EVENTS extends { [key in keyof EVENTS]: (...args: any[]) => void } = Record<
      string,
      (...args: any[]) => void
    >,
  > {
    on<NAME extends string & keyof EVENTS>(name: NAME, f: EVENTS[NAME]): this
    off<NAME extends string & keyof EVENTS>(name: NAME, f: EVENTS[NAME]): this
    once<NAME extends string & keyof EVENTS>(name: NAME, f: EVENTS[NAME]): this
    emit<NAME extends string & keyof EVENTS>(
      name: NAME,
      args: Parameters<EVENTS[NAME]>,
    ): this
    destroy(): void
  }
}

declare module 'lib0/random' {
  export function uint32(): number
  export function uuidv4(): string
}

declare module 'lib0/encoding' {
  export type Encoder = unknown
}

declare module 'lib0/decoding' {
  export type Decoder = unknown
}
