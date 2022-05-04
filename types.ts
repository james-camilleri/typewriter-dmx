export interface Config {
  charsPerLine: number
  newlineRotationDegrees: number
  slowDelay: number
  fastDelay: number
  keyMap: { [key: string]: number | number[] }
}
