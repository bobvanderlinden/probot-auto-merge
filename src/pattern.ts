export interface RegexPattern {
  regex: RegExp
}
export type LiteralPattern = string
export type Pattern = RegexPattern | LiteralPattern

export function matchesPattern (pattern: Pattern, input: string) {
  if (typeof pattern === 'string') {
    return pattern === input
  } else if ('regex' in pattern) {
    return pattern.regex.test(input)
  } else {
    throw new Error(`Invalid pattern at runtime: ${typeof pattern}`)
  }
}

export function stringifyPattern (pattern: Pattern) {
  if (typeof pattern === 'string') {
    return pattern;
  } else if ('regex' in pattern) {
    return `{regex: ${pattern.regex}}`
  } else {
    return '[invalid pattern]'
  }
}
