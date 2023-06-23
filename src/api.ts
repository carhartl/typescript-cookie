import {
  CookieAttributes,
  CookieAttributesConfig,
  CookieCodecConfig,
  CookieDecoding,
  CookieEncoding,
  Decoder
} from '../types/index'
import {
  decodeName as defaultNameDecoder,
  decodeValue as defaultValueDecoder,
  encodeName as defaultNameEncoder,
  encodeValue as defaultValueEncoder
} from './codec'

function stringifyAttributes(
  attributes: CookieAttributes & { expires?: any }
): string {
  // Copy incoming attributes as to not alter the original object..
  attributes = Object.assign({}, attributes)

  if (typeof attributes.expires === 'number') {
    attributes.expires = new Date(Date.now() + attributes.expires * 864e5)
  }
  if (attributes.expires != null) {
    attributes.expires = attributes.expires.toUTCString()
  }

  return (
    Object.entries(attributes)
      .filter(([key, value]: [string, any]) => value != null && value !== false)
      // Considers RFC 6265 section 5.2:
      // ...
      // 3.  If the remaining unparsed-attributes contains a %x3B (";")
      //     character:
      // Consume the characters of the unparsed-attributes up to,
      // not including, the first %x3B (";") character.
      // ...
      .map(([key, value]: [string, string | true]) =>
        value === true ? `; ${key}` : `; ${key}=${value.split(';')[0]}`
      )
      .join('')
  )
}

type GetReturn<T, R> = [T] extends [undefined]
  ? { [property: string]: R }
  : R | undefined

function get<T extends string | undefined, U>(
  name: T,
  decodeValue: Decoder<U>,
  decodeName: Decoder<string>
): GetReturn<T, U> {
  const scan = /(?:^|; )([^=]*)=([^;]*)/g
  const jar: any = {}
  let match
  while ((match = scan.exec(document.cookie)) != null) {
    try {
      const found = decodeName(match[1])
      jar[found] = decodeValue(match[2], found)
      if (name === found) {
        break
      }
    } catch (e) {
      // Do nothing...
    }
  }

  return name != null ? jar[name] : jar
}

export const DEFAULT_CODEC: CookieCodecConfig<
  string | number | boolean | undefined | null,
  string
> = Object.freeze({
  decodeName: defaultNameDecoder,
  decodeValue: defaultValueDecoder,
  encodeName: defaultNameEncoder,
  encodeValue: defaultValueEncoder
})

export const DEFAULT_ATTRIBUTES: CookieAttributesConfig = Object.freeze({
  path: '/'
})

// The following overloads are necessary as to make the type of `value`
// and encoder dependent and achieve typesafety along with default encoder
// in the destructured argument of `setCookie()`:
// These types are all ok and default encoder deals with them:
// setCookie('c', 'foo')
// setCookie('c', 1234)
// setCookie('c', true)
// setCookie('c', undefined)
// setCookie('c', null)
// Objects are not supported by the default encoder and require
// an encoder that operates on the given type..
// setCookie('c', {}) // Argument of type '{}' is not assignable to parameter of type 'string | number | boolean'.
// setCookie('c', {}, undefined, { encodeValue: (v) => v as string }) // Ok!
// setCookie('c', new Date()) // Argument of type 'Date' is not assignable to parameter of type 'string | number | boolean'.
// setCookie('c', new Date(), undefined, { encodeValue: (v) => v.toISOString() }) // Ok!
export function setCookie<
  T extends string | number | boolean | undefined | null
>(name: string, value: T): string

export function setCookie<
  T extends string | number | boolean | undefined | null
>(name: string, value: T, attributes: CookieAttributes): string

export function setCookie<T>(
  name: string,
  value: T,
  attributes: CookieAttributes | undefined,
  { encodeValue, encodeName }: CookieEncoding<T>
): string

export function setCookie(
  name: string,
  value: string | number | boolean | undefined | null,
  attributes: CookieAttributes = DEFAULT_ATTRIBUTES,
  {
    encodeValue = defaultValueEncoder,
    encodeName = defaultNameEncoder
  }: CookieEncoding<string | number | boolean | undefined | null> = {}
): string {
  return (document.cookie = `${encodeName(name)}=${encodeValue(
    value,
    name
  )}${stringifyAttributes(attributes)}`)
}

export function getCookie(name: string): string | undefined

export function getCookie<T>(
  name: string,
  { decodeValue, decodeName }: CookieDecoding<T>
): T | undefined

export function getCookie(
  name: string,
  {
    decodeValue = defaultValueDecoder,
    decodeName = defaultNameDecoder
  }: CookieDecoding<string> = {}
): string | undefined {
  return get(name, decodeValue, decodeName)
}

export function getCookies(): {
  [property: string]: string
}

export function getCookies<T>({ decodeValue, decodeName }: CookieDecoding<T>): {
  [property: string]: T
}

export function getCookies({
  decodeValue = defaultValueDecoder,
  decodeName = defaultNameDecoder
}: CookieDecoding<string> = {}): {
  [property: string]: string
} {
  return get(undefined, decodeValue, decodeName)
}

export function removeCookie(
  name: string,
  attributes: CookieAttributes = DEFAULT_ATTRIBUTES
): void {
  setCookie(
    name,
    '',
    Object.assign({}, attributes, {
      expires: -1
    })
  )
}
