export interface Config {
  charsPerLine: number
  carriageReturnSteps: number
  newlineRotationSteps: number
  slowDelay: number
  fastDelay: number
  keyMap: { [key: string]: number | number[] }
}
