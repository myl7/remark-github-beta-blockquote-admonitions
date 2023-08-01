// Copyright (C) myl7
// SPDX-License-Identifier: Apache-2.0

import { visit } from 'unist-util-visit'
import type { BuildVisitor } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Blockquote, Paragraph, Text } from 'mdast'

import { handleNode as handleNodeWithLegacyTitle } from './legacyTitle'
import {
  nameFilter,
  classNameMap,
  Config,
  ConfigForLegacyTitle,
  defaultConfig,
  defaultConfigForLegacyTitle,
} from './config'

export { Config, ConfigForLegacyTitle, defaultConfig, defaultConfigForLegacyTitle }
export { mkdocsConfig as mkdocsConfigForLegacyTitle } from './legacyTitle'

const plugin: Plugin = function (providedConfig?: Partial<Config | ConfigForLegacyTitle>) {
  const legacyTitle = providedConfig?.legacyTitle ?? defaultConfig.legacyTitle
  return (tree) => {
    visit(
      tree,
      legacyTitle
        ? handleNodeWithLegacyTitle({ ...defaultConfigForLegacyTitle, ...providedConfig })
        : handleNode({ ...defaultConfig, ...providedConfig })
    )
  }
}
export default plugin

const handleNode =
  (config: Config): BuildVisitor =>
  (node) => {
    // Filter required elems
    if (node.type != 'blockquote') return
    const blockquote = node as Blockquote
    if (blockquote.children[0]?.type != 'paragraph') return
    const paragraph = blockquote.children[0]
    if (paragraph.children[0]?.type != 'text') return
    const text = paragraph.children[0]
    // A link break after the title is explicitly required by GitHub
    const titleEnd = text.value.indexOf('\n')
    if (titleEnd < 0) return
    const textBody = text.value.substring(titleEnd + 1)
    let title = text.value.substring(0, titleEnd)
    // Handle whitespaces after the title.
    // Whitespace characters are defined by GFM
    const m = /[ \t\v\f\r]+$/.exec(title)
    if (m && !config.titleKeepTrailingWhitespaces) {
      title = title.substring(0, title.length - m[0].length)
    }
    if (!nameFilter(config.titleFilter)(title)) return
    const { displayTitle, checkedTitle } = config.titleTextMap(title)

    // Update the text body
    text.value = textBody

    // Insert the title element and add classes for the title
    const paragraphTitleText: Text = { type: 'text', value: displayTitle }
    const paragraphTitle: Paragraph = {
      type: 'paragraph',
      children: [paragraphTitleText],
      data: config.dataMaps.title({
        hProperties: { className: classNameMap(config.classNameMaps.title)(checkedTitle) },
      }),
    }
    blockquote.children.unshift(paragraphTitle)

    // Add classes for the block
    blockquote.data = config.dataMaps.block({
      ...blockquote.data,
      hProperties: { className: classNameMap(config.classNameMaps.block)(checkedTitle) },
      // The blockquote should be rendered as a div, which is explicitly required by GitHub
      hName: 'div',
    })
  }

export const mkdocsConfig: Partial<Config> = {
  classNameMaps: {
    block: (title) => [
      'admonition',
      ...(title.startsWith('admonition: ') ? title.substring('admonition: '.length) : title).split(' '),
    ],
    title: 'admonition-title',
  },
  titleFilter: (title) =>
    (title.startsWith('[!admonition: ') && title.endsWith(']')) ||
    (Boolean(title.match(/^\[!(attention|caution|danger|error|hint|important|note|tip|warning)/)) &&
      title.endsWith(']')),
  titleTextMap: (title) => {
    title = title.substring(2, title.length - 1)
    // ' "' will not occur in classes
    const i = title.indexOf(' "')
    const displayTitle =
      i >= 0
        ? title.substring(i + 2, title.length - 1) // Display title is wrapped with ""
        : ''
    const checkedTitle = title.substring(0, i)
    return { displayTitle, checkedTitle }
  },
}
