/**
 * Remove ECMAScript WhiteSpace and LineTerminator characters (`\s`).
 * @see https://tc39.es/ecma262/multipage/ecmascript-language-lexical-grammar.html#sec-white-space
 * @see https://tc39.es/ecma262/multipage/ecmascript-language-lexical-grammar.html#sec-line-terminators
 */
const WHITESPACE_RE = /\s/gu;

export function removeWhitespace(input: string): string {
  return input.replace(WHITESPACE_RE, '');
}
