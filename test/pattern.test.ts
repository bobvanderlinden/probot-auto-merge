import { matchesPattern, stringifyPattern } from '../src/pattern'

describe('matchesPattern', () => {
  describe('while using literal pattern', () => {
    it('should return true when pattern equals input', () => {
      expect(matchesPattern('word', 'word')).toBe(true)
    })
    it('should return false when input matches only partially', () => {
      expect(matchesPattern('word', 'abc word abc')).toBe(false)
    })
    it('should return false when input has different casing', () => {
      expect(matchesPattern('word', 'Word')).toBe(false)
    })
  })

  describe('while using regex pattern', () => {
    it('should return true when pattern matches input', () => {
      expect(matchesPattern({ regex: /word/ }, 'word')).toBe(true)
    })
    it('should return true when input has part of pattern', () => {
      expect(matchesPattern({ regex: /word/ }, 'abc word abc')).toBe(true)
    })
    it('should return false when input has different casing', () => {
      expect(matchesPattern({ regex: /word/ }, 'Word')).toBe(false)
    })
  })
})

describe('stringifyPattern', () => {
  it('should stringify literal patterns', () => {
    expect(stringifyPattern('pattern')).toBe('pattern')
  })
  it('should stringify regex patterns', () => {
    expect(stringifyPattern({ regex: /pattern/ })).toBe('{regex: /pattern/}')
  })
})
