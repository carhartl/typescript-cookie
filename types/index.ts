export interface WellKnownCookieAttributes {
  path?: string
  domain?: string
  expires?: number | Date
  sameSite?: 'strict' | 'Strict' | 'lax' | 'Lax' | 'none' | 'None'
  secure?: boolean
}

export type CookieAttributes =
  | WellKnownCookieAttributes
  | { [property: string]: string | boolean | undefined }

export type CookieAttributesConfig = Readonly<CookieAttributes>

export type Decoder<T> = (value: string, name?: string) => T

export type Encoder<T> = (value: T, name?: string) => string

export interface CookieDecoding<T> {
  readonly decodeName?: Decoder<string>
  readonly decodeValue?: Decoder<T>
}

export interface CookieEncoding<T> {
  readonly encodeName?: Encoder<string>
  readonly encodeValue?: Encoder<T>
}

export interface CookieCodecConfig<W, R> {
  readonly decodeName: Decoder<string>
  readonly decodeValue: Decoder<R>
  readonly encodeName: Encoder<string>
  readonly encodeValue: Encoder<W>
}

export interface CookieConverter<W, R> {
  read: Decoder<R>
  write: Encoder<W>
}

export type CookieConverterConfig<W, R> = Readonly<CookieConverter<W, R>>

interface CookiesConfig<W, R> {
  readonly converter: CookieConverterConfig<W, R>
  readonly attributes: CookieAttributesConfig
}

interface CookiesApi<W, R> {
  set: (
    name: string,
    value: W,
    attributes?: CookieAttributes
  ) => string | undefined
  get: (
    name?: string | undefined | null
  ) => R | undefined | { [property: string]: R }
  remove: (name: string, attributes?: CookieAttributes) => void
  withAttributes: <W, R>(attributes: CookieAttributes) => Cookies<W, R>
  withConverter: <W, R>(converter: {
    write?: Encoder<W>
    read?: Decoder<R>
  }) => Cookies<W, R>
}

export type Cookies<W, R> = CookiesConfig<W, R> & CookiesApi<W, R>
