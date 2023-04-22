# TypeScript Cookie [![CI Status](https://github.com/carhartl/typescript-cookie/actions/workflows/ci.yml/badge.svg)](https://github.com/carhartl/typescript-cookie/actions/workflows/ci.yml) [![TypeScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Maintainability](https://api.codeclimate.com/v1/badges/d87f5ff1ca1041f8723a/maintainability)](https://codeclimate.com/github/carhartl/typescript-cookie/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/d87f5ff1ca1041f8723a/test_coverage)](https://codeclimate.com/github/carhartl/typescript-cookie/test_coverage) [![npm](https://img.shields.io/github/package-json/v/carhartl/typescript-cookie)](https://www.npmjs.com/package/typescript-cookie) [![size](https://img.shields.io/bundlephobia/minzip/typescript-cookie)](https://www.npmjs.com/package/typescript-cookie)

A simple, lightweight TypeScript API for handling cookies.

## Goals/Features

- Full TypeScript support
- Support for ES modules only
- Tree-shakable
- No dependencies
- [RFC 6265](https://tools.ietf.org/html/rfc6265) compliant
- Enable [custom encoding/decoding](#codec)
- Think: [js-cookie](https://github.com/js-cookie/js-cookie) 4.0
- **< 750 bytes** gzipped!

## Installation

### NPM

```
$ npm i typescript-cookie
```

## Basic Usage

Importing:

```typescript
import { getCookie, setCookie } from 'typescript-cookie'
```

Functions not being used (that is imported) can be tree-shaken by a bundler.

Create a cookie, valid across the entire site:

```typescript
setCookie('name', 'value')
```

Create a cookie that expires 7 days from now, valid across the entire site:

```typescript
setCookie('name', 'value', { expires: 7 })
```

Create an expiring cookie, valid to the path of the current page:

```typescript
setCookie('name', 'value', { expires: 7, path: '' })
```

Read cookie:

```typescript
getCookie('name') // => 'value'
getCookie('nothing') // => undefined
```

Read all visible cookies:

```typescript
getCookies() // => { name: 'value' }
```

_Note: It is not possible to read a particular cookie by additionally passing specific cookie attributes. A cookie will only be available if it's visible from where the code is called, visibility being controlled by `path` and `domain` used when setting a cookie._

Delete cookie:

```typescript
removeCookie('name')
```

Delete a cookie valid to the path of the current page:

```typescript
setCookie('name', 'value', { path: '' })
removeCookie('name') // fail!
removeCookie('name', { path: '' }) // removed!
```

_IMPORTANT! When deleting a cookie you must pass the exact same path and domain attributes that were used to set the cookie:_

```typescript
removeCookie('name', { path: '', domain: '.yourdomain.com' })
```

_Note: Removing a nonexistent cookie neither raises an exception nor returns any value._

## Encoding

This project is [RFC 6265](http://tools.ietf.org/html/rfc6265#section-4.1.1) compliant. All special characters that are not allowed in the cookie-name or cookie-value are encoded with each one's UTF-8 Hex equivalent using [percent-encoding](http://en.wikipedia.org/wiki/Percent-encoding).  
The only character in cookie-name or cookie-value that is allowed and still encoded is the percent `%` character, it is escaped in order to interpret percent input as literal.  
Please note that the default encoding/decoding strategy is meant to be interoperable [only between cookies that are read/written by typescript-cookie](https://github.com/typescript-cookie/js-cookie/pull/200#discussion_r63270778). It's possible to [override the default encoding/decoding strategy](#codec).

_Note: According to [RFC 6265](https://tools.ietf.org/html/rfc6265#section-6.1), your cookies may get deleted if they are too big or there are too many cookies in the same domain, [more details here](https://github.com/js-cookie/js-cookie/wiki/Frequently-Asked-Questions#why-are-my-cookies-being-deleted)._

## Cookie Attributes

### expires

Define when the cookie will be removed. Value must be a [`number`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean) which will be interpreted as days from time of creation or a [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) instance. If omitted, the cookie becomes a session cookie.

To create a cookie that expires in less than a day, you can check the [FAQ on the Wiki](https://github.com/js-cookie/js-cookie/wiki/Frequently-Asked-Questions#expire-cookies-in-less-than-a-day).

**Default:** Cookie is removed when the user closes the browser.

**Examples:**

```typescript
setCookie('name', 'value', { expires: 365 })
getCookie('name')
removeCookie('name')
```

### path

A [`string`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean) indicating the path where the cookie is supposed to be visible.

**Default:** `/`

**Examples:**

```typescript
setCookie('name', 'value', { path: '' })
getCookie('name')
removeCookie('name', { path: '' })
```

### domain

A [`string`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean) indicating a valid domain where the cookie should be visible. The cookie will also be visible to all subdomains.

**Default:** Cookie is visible only to the domain or subdomain of the page where the cookie was created, except for Internet Explorer (see below).

**Examples:**

```typescript
setCookie('name', 'value', { domain: 'subdomain.site.com' })
getCookie('name')
removeCookie('name', { domain: 'subdomain.site.com' })
```

### secure

Either `true` or `false`, indicating if the cookie transmission requires a secure protocol (https).

**Default:** No secure protocol requirement.

**Examples:**

```typescript
setCookie('name', 'value', { secure: true })
getCookie('name')
removeCookie('name')
```

### sameSite

A [`string`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean), allowing to control whether the browser is sending a cookie along with cross-site requests.

Default: not set.

**Note that more recent browsers are making "Lax" the default value even without specifiying anything here.**

**Examples:**

```typescript
setCookie('name', 'value', { sameSite: 'strict' })
getCookie('name')
removeCookie('name')
```

## Codec

### Decode

All get methods that rely on a proper decoding to work, such as `getCookies()` and `getCookie()`, will run the given decoder for each cookie. The returned value will be used as the cookie value.

Example from reading one of the cookies that can only be decoded using the `escape` function:

```typescript
import { DEFAULT_CODEC, getCookie, getCookies } from 'typescript-cookie'

document.cookie = 'escaped=%u5317'
document.cookie = 'default=%E5%8C%97'

const read: Decoder<string> = (value, name) => {
  if (name === 'escaped') {
    return unescape(value)
  }
  // Fall back to default for all other cookies
  return DEFAULT_CODEC.decodeValue(value, name)
}

getCookie('escaped', read) // => '北'
getCookie('default', read) // => '北'
getCookies(read) // => { escaped: '北', default: '北' }
```

### Encode

Set a cookie with overriding the default encoding implementation:

```typescript
import { setCookie } from 'typescript-cookie'

const write: Encoder<string> = (value) => value.toUpperCase()

setCookie('uppercased', 'foo', undefined, write) // => 'uppercased=FOO; path=/'
```

## js-cookie compatibility

To ease migration while getting full TypeScript support there's a compat module that provides an api similar to [js-cookie](https://github.com/js-cookie/js-cookie):

```typescript
import { Cookies } from 'typescript-cookie'

Cookies.get('name')
```

## Testing

```
$ npm test
```

Run tests continuously:

```
$ npm test -- --watch
```

## Releasing

Releasing should be done via the `Release` GitHub Actions workflow, so that published packages on npmjs.com have package provenance.

GitHub releases are created as a draft and need to be published manually!
(This is so we are able to craft suitable release notes before publishing.)
