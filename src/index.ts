// Copyright 2022 myl7
// SPDX-License-Identifier: Apache-2.0

import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Blockquote } from 'mdast'

const plugin: Plugin = function (providedConfig?: Partial<Config>) {
  const config: Config = { ...defaultConfig, ...providedConfig }
  return function (tree) {
    visit(tree, node => {
      if (node.type != 'blockquote') return
      const blockquote = node as Blockquote
      if (blockquote.children.length <= 0 || blockquote.children[0].type != 'paragraph') return
      const paragraph = blockquote.children[0]
      if (paragraph.children.length <= 0 || paragraph.children[0].type != 'strong') return
      const strong = paragraph.children[0]
      if (strong.children.length != 1 || strong.children[0].type != 'text') return
      const text = strong.children[0]
      const title = text.value
      if (!formatNameFilter(config.titleFilter)(title)) return

      blockquote.data = {
        ...blockquote.data,
        hProperties: { className: formatClassNameMap(config.classNameMaps.block)(title) },
      }
      strong.data = {
        ...strong.data,
        hProperties: { className: formatClassNameMap(config.classNameMaps.title)(title) },
      }
    })
  }
}
export default plugin

export interface Config {
  classNameMaps: {
    block: ClassNameMap
    title: ClassNameMap
  }
  titleFilter: NameFilter
}
export const defaultConfig: Config = {
  classNameMaps: {
    block: 'admonition',
    title: 'admonition-title',
  },
  titleFilter: ['Note', 'Warning'],
}

type ClassNames = string | string[]
type ClassNameMap = ClassNames | ((title: string) => ClassNames)
function formatClassNameMap(gen: ClassNameMap) {
  return (title: string) => {
    const classNames = typeof gen == 'function' ? gen(title) : gen
    return typeof classNames == 'object' ? classNames.join(' ') : classNames
  }
}

type NameFilter = ((title: string) => boolean) | string[]
function formatNameFilter(filter: NameFilter) {
  return (title: string) => {
    return typeof filter == 'function' ? filter(title) : filter.includes(title)
  }
}
