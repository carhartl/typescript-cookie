/* global describe, expect, test */

import { decodeName, decodeValue, encodeName, encodeValue } from '../src/codec'

const NAME_DISALLOWED_CHARS_INPUT_OUTPUT: { [key: string]: string } = {
  '(': '%28',
  ')': '%29',
  '<': '%3C',
  '>': '%3E',
  '@': '%40',
  ',': '%2C',
  ';': '%3B',
  ':': '%3A',
  '\\': '%5C',
  '"': '%22',
  '/': '%2F',
  '[': '%5B',
  ']': '%5D',
  '?': '%3F',
  '=': '%3D',
  '{': '%7B',
  '}': '%7D',
  ' ': '%20',
  '\t': '%09'
}

const VALUE_DISALLOWED_CHARS_INPUT_OUTPUT: { [key: string]: string } = {
  ' ': '%20',
  '"': '%22',
  ',': '%2C',
  ';': '%3B',
  '\\': '%5C'
}

describe('encodeName', () => {
  describe('RFC 6265 compliance', () => {
    test('with disallowed character in cookie name (token)', () => {
      for (const input in NAME_DISALLOWED_CHARS_INPUT_OUTPUT) {
        expect(encodeName(input)).toBe(
          NAME_DISALLOWED_CHARS_INPUT_OUTPUT[input]
        )
      }
    })

    test('with more than one disallowed character in cookie name', () => {
      expect(encodeName('(())')).toBe('%28%28%29%29')
    })
  })
})

describe('encodeValue', () => {
  test('when number value', () => {
    expect(encodeValue(1234)).toBe('1234')
  })

  test('when boolean value', () => {
    expect(encodeValue(true)).toBe('true')
  })

  test('when null value', () => {
    expect(encodeValue(null)).toBe('null')
  })

  test('when undefined value', () => {
    expect(encodeValue(undefined)).toBe('undefined')
  })

  describe('RFC 6265 compliance', () => {
    test('with disallowed character in cookie value (cookie-octet)', () => {
      for (const input in VALUE_DISALLOWED_CHARS_INPUT_OUTPUT) {
        expect(encodeValue(input)).toBe(
          VALUE_DISALLOWED_CHARS_INPUT_OUTPUT[input]
        )
      }
    })

    test('with more than one disallowed character in cookie value', () => {
      expect(encodeValue(';;')).toBe('%3B%3B')
    })
  })
})

describe('decodeName', () => {
  describe('RFC 6265 compliance', () => {
    test('with disallowed character in cookie name (token)', () => {
      for (const input in NAME_DISALLOWED_CHARS_INPUT_OUTPUT) {
        expect(decodeName(NAME_DISALLOWED_CHARS_INPUT_OUTPUT[input])).toBe(
          input
        )
      }
    })
  })
})

describe('decodeValue', () => {
  // github.com/carhartl/jquery-cookie/issues/215
  test('when percent character in cookie value', () => {
    expect(decodeValue('foo%')).toBe('foo%')
  })

  test('when lowercase percent character in cookie value', () => {
    expect(decodeValue('%d0%96')).toBe('Ж')
  })

  describe('RFC 6265 compliance', () => {
    test('when value (cookie-octet) enclosed in DQUOTE', () => {
      expect(decodeValue('"v"')).toBe('v')
    })

    test('with disallowed, encoded character in cookie value', () => {
      for (const input in VALUE_DISALLOWED_CHARS_INPUT_OUTPUT) {
        expect(decodeValue(VALUE_DISALLOWED_CHARS_INPUT_OUTPUT[input])).toBe(
          input
        )
      }
    })

    test('with more than one disallowed, encoded character in cookie value', () => {
      expect(decodeValue('%3B%3B')).toBe(';;')
    })
  })
})
