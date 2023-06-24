/* global afterEach, describe, expect, test */

import { getCookie, getCookies, removeCookie, setCookie } from '../src/api'

describe('setCookie', () => {
  afterEach(() => {
    // Clean up test cookie!
    document.cookie = 'c=v; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  test('when simple value', () => {
    setCookie('c', 'v')
    expect(document.cookie).toBe('c=v')
  })

  test('when value matches "[object Object]"', () => {
    setCookie('c', '[object Object]')
    expect(document.cookie).toBe('c=[object%20Object]')
  })

  test('return value is written cookie string', () => {
    expect(setCookie('c', 'v')).toBe('c=v; path=/')
  })

  describe('with attributes', () => {
    test("won't alter passed attributes object", () => {
      const attributes = { path: '/test' }
      setCookie('c', 'v', attributes)
      expect(attributes).toStrictEqual({ path: '/test' })
      document.cookie = 'c=v; path=/test; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    })

    test('using predefined default path', () => {
      expect(setCookie('c', 'v')).toMatch(/; path=\/$/)
    })

    test('when undefined path value', () => {
      expect(
        setCookie('c', 'v', {
          path: undefined
        })
      ).toBe('c=v')
    })

    test('when true secure value', () => {
      expect(setCookie('c', 'v', { secure: true })).toMatch(/; secure$/)
    })

    // github.com/js-cookie/js-cookie/pull/54
    test('when false secure value', () => {
      expect(setCookie('c', 'v', { secure: false })).not.toMatch('secure')
    })

    test('when undefined secure value', () => {
      expect(
        setCookie('c', 'v', {
          secure: undefined
        })
      ).toBe('c=v')
    })

    test('when expires as days from now', () => {
      const days = 200
      const expires = new Date(
        new Date().valueOf() + days * 24 * 60 * 60 * 1000
      )
      expect(setCookie('c', 'v', { expires: days })).toMatch(
        `; expires=${expires.toUTCString()}`
      )
    })

    test('when expires as fraction of a day', () => {
      const written = setCookie('c', 'v', { expires: 0.5 })
      const dateMatch = written.match(/expires=(.+)/)
      const stringifiedDate = dateMatch != null ? dateMatch[1] : ''
      const expires = new Date(stringifiedDate)
      const then = new Date(new Date().valueOf() + 12 * 60 * 60 * 1000) // half a day...
      // When we were using Date.setDate() fractions have been ignored
      // and expires resulted in the current date. Allow 1000 milliseconds
      // difference for execution time because new Date() can be different,
      // even when it's run synchronously.
      // See https://github.com/js-cookie/js-cookie/commit/ecb597b65e4c477baa2b30a2a5a67fdaee9870ea#commitcomment-20146048.
      expect(expires.getTime()).toBeLessThanOrEqual(then.getTime())
      expect(expires.getTime()).toBeGreaterThanOrEqual(then.getTime() - 1000)
    })

    test('when expires as Date instance', () => {
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      expect(setCookie('c', 'v', { expires: sevenDaysFromNow })).toMatch(
        `; expires=${sevenDaysFromNow.toUTCString()}`
      )
    })

    test('when undefined expires value', () => {
      expect(
        setCookie('c', 'v', {
          expires: undefined
        })
      ).toBe('c=v')
    })

    test('when undefined domain value', () => {
      expect(
        setCookie('c', 'v', {
          domain: undefined
        })
      ).toBe('c=v')
    })

    // github.com/js-cookie/js-cookie/issues/276
    test('when arbitrary attribute', () => {
      expect(
        setCookie('c', 'v', {
          arbitrary: 'foo'
        })
      ).toMatch('; arbitrary=foo')
    })

    test('when undefined arbitrary value', () => {
      expect(
        setCookie('c', 'v', {
          arbitrary: undefined
        })
      ).toBe('c=v')
    })

    // github.com/js-cookie/js-cookie/issues/396
    test('sanitizing of attributes to prevent XSS from untrusted input', () => {
      expect(
        setCookie('c', 'v', {
          path: '/;domain=sub.domain.com',
          domain: 'site.com;remove_this',
          customAttribute: 'value;;remove_this'
        })
      ).toBe('c=v; path=/; domain=site.com; customAttribute=value')
    })
  })

  describe('encode', () => {
    test('with customized value encoding', () => {
      setCookie('c', 'v', undefined, {
        encodeValue: (value) => value.toUpperCase()
      })
      expect(document.cookie).toBe('c=V')
    })

    test('conditionally encoding a particular cookie value only', () => {
      setCookie('c', '北', undefined, {
        encodeValue: (value, name) => {
          if (name === 'c') {
            return escape(value)
          }
          return value
        }
      })
      expect(document.cookie).toBe('c=%u5317')
    })

    test('converting non-String values', () => {
      setCookie('c', { foo: 'bar' }, undefined, {
        encodeValue: (value) => JSON.stringify(value)
      })
      expect(document.cookie).toBe('c={"foo":"bar"}')
    })

    test('with customized name encoding', () => {
      setCookie('c[]', 'v', undefined, { encodeName: (value) => value })
      expect(document.cookie).toBe('c[]=v')
      document.cookie = 'c[]=v; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    })
  })
})

describe('getCookie', () => {
  afterEach(() => {
    // Clean up test cookie!
    document.cookie = 'c=v; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  test('when simple value', () => {
    document.cookie = 'c=v'
    expect(getCookie('c')).toBe('v')
  })

  test('when not existing', () => {
    expect(getCookie('whatever')).toBeUndefined()
  })

  // github.com/carhartl/jquery-cookie/issues/50
  test('when equality sign in cookie value', () => {
    document.cookie = 'c=foo=bar'
    expect(getCookie('c')).toBe('foo=bar')
  })

  test('when unencoded percent character in cookie value mixed with encoded values not permitted', () => {
    document.cookie = 'c=foo%bar%22baz%qux'
    expect(getCookie('bad')).toBeUndefined()
  })

  // github.com/js-cookie/js-cookie/issues/196
  test('when there is another unrelated cookie with malformed encoding in the name', () => {
    document.cookie = '%A1=foo'
    document.cookie = 'c=v'
    expect(() => getCookie('c')).not.toThrow()
    document.cookie = '%A1=foo; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  // github.com/js-cookie/js-cookie/pull/62
  test('when there is another unrelated cookie with malformed encoding in the value', () => {
    document.cookie = 'invalid=%A1'
    document.cookie = 'c=v'
    expect(() => getCookie('c')).not.toThrow()
    document.cookie = 'invalid=foo; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  test('when there is a duplicate cookie', () => {
    document.cookie = 'c=one; path=/'
    document.cookie = 'c=two; path=/test'
    expect(getCookie('c')).toBe('two') // 2nd (nested) cookie comes first...!
    document.cookie = 'c=v; path=/test; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  describe('decode', () => {
    test('with customized value decoding', () => {
      document.cookie = 'c=v'
      expect(
        getCookie('c', { decodeValue: (value) => value.toUpperCase() })
      ).toBe('V')
    })

    test('conditionally decoding a particular cookie value only', () => {
      document.cookie = 'c=%u5317'
      expect(
        getCookie('c', {
          decodeValue: (value, name) => {
            if (name === 'c') {
              return unescape(value)
            }
            return value
          }
        })
      ).toBe('北')
    })

    test('converting non-String values', () => {
      document.cookie = 'c={"foo":"bar"}'
      expect(
        getCookie('c', { decodeValue: (value) => JSON.parse(value) })
      ).toStrictEqual({
        foo: 'bar'
      })
    })

    test('with customized name decoding', () => {
      document.cookie = 'c[]=v'
      expect(getCookie('c[]', { decodeName: (name) => name })).toBe('v')
      document.cookie = 'c[]=v; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    })
  })
})

describe('getCookies', () => {
  afterEach(() => {
    // Clean up test cookie!
    document.cookie = 'c=v; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  test('when there are cookies', () => {
    document.cookie = 'one=foo'
    document.cookie = 'two=bar'
    expect(getCookies()).toStrictEqual({ one: 'foo', two: 'bar' })
    document.cookie = 'one=foo; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'two=bar; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  test('when there are no cookies yet', () => {
    expect(getCookies()).toStrictEqual({})
  })

  test('when there are duplicate cookies', () => {
    document.cookie = 'c=one; path=/'
    document.cookie = 'c=two; path=/test'
    expect(getCookies()).toStrictEqual({ c: 'two' }) // 2nd (nested) cookie comes first...!
    document.cookie = 'c=v; path=/test; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  // github.com/js-cookie/js-cookie/issues/196
  test('when there is a cookie with malformed encoding in the name', () => {
    document.cookie = '%A1=foo'
    document.cookie = 'c=v'
    expect(() => getCookies()).not.toThrow()
    document.cookie = '%A1=foo; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  // github.com/js-cookie/js-cookie/pull/62
  test('when there is a cookie with malformed encoding in the value', () => {
    document.cookie = 'invalid=%A1'
    document.cookie = 'c=v'
    expect(() => getCookies()).not.toThrow()
    document.cookie = 'invalid=foo; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  describe('decode', () => {
    test('with customized value decoding', () => {
      document.cookie = 'c=v'
      expect(
        getCookies({ decodeValue: (value) => value.toUpperCase() })
      ).toStrictEqual({
        c: 'V'
      })
    })

    test('conditionally decoding a particular cookie value only', () => {
      document.cookie = 'c=%u5317'
      expect(
        getCookies({
          decodeValue: (value, name) => {
            if (name === 'c') {
              return unescape(value)
            }
            return value
          }
        })
      ).toStrictEqual({ c: '北' })
    })

    test('converting non-String values', () => {
      document.cookie = 'c={"foo":"bar"}'
      expect(
        getCookies({ decodeValue: (value) => JSON.parse(value) })
      ).toStrictEqual({
        c: { foo: 'bar' }
      })
    })

    test('with customized name decoding', () => {
      document.cookie = 'c[]=v'
      expect(getCookies({ decodeName: (name) => name })).toStrictEqual({
        'c[]': 'v'
      })
      document.cookie = 'c[]=v; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    })
  })
})

describe('removeCookie', () => {
  test('erases given cookie', () => {
    document.cookie = 'c=v; path=/'
    removeCookie('c')
    expect(document.cookie).toBe('')
  })

  describe('with attributes', () => {
    test("won't alter passed attributes object", () => {
      const attributes = { path: '/test' }
      removeCookie('c', attributes)
      expect(attributes).toStrictEqual({ path: '/test' })
    })

    test('using predefined default path', () => {
      document.cookie = 'c=v; path=/'
      removeCookie('c')
      expect(document.cookie).toBe('')
    })

    test('with particular path', () => {
      document.cookie = 'c=v; path=/'
      removeCookie('c', { path: '/test' })
      expect(document.cookie).toBe('c=v')
      removeCookie('c', { path: '/' })
      expect(document.cookie).toBe('')
    })
  })
})
