// Copyright (C) myl7
// SPDX-License-Identifier: Apache-2.0

import type { BuildVisitor } from 'unist-util-visit'
import type { Blockquote, Paragraph, Text } from 'mdast'

import { ConfigForLegacyTitle as Config, classNameMap, nameFilter } from './config.js'

export const handleNode =
  (config: Config): BuildVisitor =>
  (node) => {
    // Filter required elems
    if (node.type != 'blockquote') return
    const blockquote = node as Blockquote
    if (blockquote.children.length <= 0 || blockquote.children[0].type != 'paragraph') return
    const paragraph = blockquote.children[0]
    if (paragraph.children.length <= 0 || paragraph.children[0].type != 'strong') return
    const strong = paragraph.children[0]
    if (strong.children.length != 1 || strong.children[0].type != 'text') return
    const text = strong.children[0]
    const title = text.value
    if (!nameFilter(config.titleFilter)(title)) return
    const { displayTitle, checkedTitle } = config.titleTextMap(title)

    // Update title
    text.value = displayTitle

    // Add classes for the block and title
    blockquote.data = config.dataMaps.block({
      ...blockquote.data,
      hProperties: { className: classNameMap(config.classNameMaps.block)(checkedTitle) },
    })
    strong.data = config.dataMaps.title({
      ...strong.data,
      hProperties: { className: classNameMap(config.classNameMaps.title)(checkedTitle) },
    })

    // Handle title lift
    if (config.titleLift) {
      const strongToLift = paragraph.children.splice(0, 1)[0]
      let paragraphTitle: Paragraph
      // Handle title unwrap
      if (config.titleUnwrap) {
        const paragraphTitleText: Text = { type: 'text', value: displayTitle }
        paragraphTitle = {
          type: 'paragraph',
          children: [paragraphTitleText],
          data: config.dataMaps.title({
            hProperties: { className: classNameMap(config.classNameMaps.title)(checkedTitle) },
          }),
        }
      } else {
        paragraphTitle = { type: 'paragraph', children: [strongToLift] }
      }
      blockquote.children.unshift(paragraphTitle)
      // Handle whitespace after the title
      // Whitespace characters are defined by GFM
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const paragraphModified = paragraph as Paragraph
      if (paragraphModified.children.length > 0 && paragraphModified.children[0].type == 'text') {
        const text = paragraphModified.children[0]
        const re = /^[ \t\n\v\f\r]*/
        const m = re.exec(text.value)
        const whitespaces = m ? m[0] : ''
        text.value = config.titleLiftWhitespaces(whitespaces) + text.value.slice(whitespaces.length)
      }
    }
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
    title.startsWith('admonition: ') ||
    Boolean(title.match(/^(attention|caution|danger|error|hint|important|note|tip|warning)/)),
  titleLift: true,
  titleUnwrap: true,
  titleTextMap: (title) => {
    // ' "' will not occur in classes
    const i = title.indexOf(' "')
    const displayTitle =
      i >= 0
        ? title.substring(i + 2, title.length - 1) // Display title is wrapped with ""
        : ''
    const checkedTitle = title.substring(0, i)
    return { displayTitle, checkedTitle }
  },
  dataMaps: {
    block: (data) => ({ ...data, hName: 'div' }),
    title: (data) => data,
  },
}
