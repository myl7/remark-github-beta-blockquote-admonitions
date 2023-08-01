// Copyright (C) myl7
// SPDX-License-Identifier: Apache-2.0

import type { Data } from 'unist'

export interface Config {
  classNameMaps: {
    block: ClassNameMap
    title: ClassNameMap
  }
  titleFilter: NameFilter
  titleTextMap: (title: string) => { displayTitle: string; checkedTitle: string }
  dataMaps: {
    block: (data: Data) => Data
    title: (data: Data) => Data
  }
  titleTrailingWhitespaces: ((whitespaces: string) => string) | null
  legacyTitle: boolean
}

export const defaultConfig: Config = {
  classNameMaps: {
    block: 'admonition',
    title: 'admonition-title',
  },
  titleFilter: ['NOTE', 'IMPORTANT', 'WARNING'],
  titleTextMap: (title) => ({
    displayTitle: title.substring(2, title.length - 1),
    checkedTitle: title.substring(2, title.length - 1),
  }),
  dataMaps: {
    block: (data) => data,
    title: (data) => data,
  },
  titleTrailingWhitespaces: null,
  legacyTitle: false,
}

// Config only for legacy titles like **Note**
export interface ConfigForLegacyTitle extends Config {
  titleLift: boolean
  titleLiftWhitespaces: (whitespaces: string) => string
  titleUnwrap: boolean
}

export const defaultConfigForLegacyTitle: ConfigForLegacyTitle = {
  ...defaultConfig,
  titleFilter: ['Note', 'Warning'],
  titleTextMap: (title) => ({ displayTitle: title, checkedTitle: title }),
  legacyTitle: false,
  titleLift: false,
  titleLiftWhitespaces: () => '',
  titleUnwrap: false,
}

type ClassNames = string | string[]
type ClassNameMap = ClassNames | ((title: string) => ClassNames)

export function classNameMap(gen: ClassNameMap) {
  return (title: string) => {
    const classNames = typeof gen == 'function' ? gen(title) : gen
    return typeof classNames == 'object' ? classNames.join(' ') : classNames
  }
}

type NameFilter = ((title: string) => boolean) | string[]

export function nameFilter(filter: NameFilter) {
  return (title: string) => {
    return typeof filter == 'function' ? filter(title) : filter.includes(title)
  }
}
