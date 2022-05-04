export interface Config {
  charsPerLine: number
  carriageReturnSteps: number
  newlineRotationSteps: number
  delaySlow: number
  delayFast: number
  keyMap: { [key: string]: number | number[] }
}
