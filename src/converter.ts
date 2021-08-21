import { ReadConverter, WriteConverter } from '../types/index'

export const writeValue: WriteConverter = (
  value: string | number | boolean | undefined | null
): string => {
  return encodeURIComponent(value as string).replace(
    /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
    decodeURIComponent
  )
}

export const readValue: ReadConverter = (value: string): string => {
  return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
}
