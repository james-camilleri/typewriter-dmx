import { configure, splitLongLine } from './index'

describe('splitLongLine()', () => {
  beforeAll(() => {
    configure({
      charsPerLine: 20,
    })
  })

  it('leaves a string under the maximum length as is', () => {
    const testString = 'This string is short'
    const splitString = splitLongLine(testString)

    expect(splitString).toEqual(testString)
  })

  it('does not split punctuation from neighbouring words', () => {
    const testString = 'This string is short?'
    const splitString = splitLongLine(testString)

    expect(splitString).toEqual([testString])
  })

  it('splits a long string over two lines', () => {
    const testString = 'This string is less short.'
    const splitString = splitLongLine(testString)

    expect(splitString).toEqual(['This string is less', 'short.'])
  })

  it('splits a long string over multiple lines', () => {
    const testString =
      'This string is a lot less short, and should be split over multiple lines.'
    const splitString = splitLongLine(testString)

    expect(splitString).toEqual([
      'This string is a lot',
      'less short, and',
      'should be split over',
      'multiple lines.',
    ])
  })
})
