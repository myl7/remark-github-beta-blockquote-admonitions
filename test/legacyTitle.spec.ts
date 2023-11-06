// Copyright (C) myl7
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest'
import { parseDocument } from 'htmlparser2'
import { selectOne } from 'css-select'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import plugin, { ConfigForLegacyTitle as Config, mkdocsConfigForLegacyTitle as mkdocsConfig } from '../src/index.js'

function defineCase(
  name: string,
  options: {
    input: string
    assertions: (html: string) => Promise<void> | void
    config?: Partial<Config>
  }
) {
  it(name, async function () {
    const processor = remark()
      .use(remarkParse)
      .use(plugin, { ...options.config, legacyTitle: true })
      .use(remarkRehype)
      .use(rehypeStringify)

    const html = String(await processor.process(options.input))
    await options.assertions(html)

    expect(html).toMatchSnapshot()
  })
}

describe('GitHub beta blockquote-based admonitions with legacy titles like **Note**', function () {
  defineCase('should transform', {
    input: `\
# Admonitions
> **Note**
> test
`,
    assertions(html) {
      const elem = selectOne(
        'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'Note')
    },
  })

  defineCase('should transform when single line', {
    input: `\
# Admonitions
> **Note** test
`,
    assertions(html) {
      const elem = selectOne(
        'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'Note')
    },
  })

  defineCase('should transform with nested ones', {
    input: `\
# Admonitions
> **Note**
> test
>
> > **Note**
> > test
> >
> > > **Warning**
> > > test
`,
    assertions(html) {
      const elem = selectOne(
        'blockquote.admonition > blockquote.admonition > blockquote.admonition > p:first-child > strong.admonition-title:first-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'Warning')
    },
  })

  defineCase('should not transform when title is not strong', {
    input: `\
# Admonitions
> *Note*
> test
`,
    assertions(html) {
      const elem = selectOne(
        'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
        parseDocument(html)
      )
      expect(elem).to.be.null
    },
  })
})

describe('the plugin options for legacy titles like **Note**', function () {
  defineCase('should accept custom class names', {
    input: `\
# Admonitions
> **Note**
> test
`,
    config: {
      classNameMaps: {
        block: 'ad',
        title: ['ad-title1', 'ad-title2'],
      },
    },
    assertions(html) {
      const elem = selectOne(
        'blockquote.ad > p:first-child > strong.ad-title1.ad-title2:first-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'Note')
    },
  })

  defineCase('should accept custom class names with functions', {
    input: `\
# Admonitions
> **Note**
> test
`,
    config: {
      classNameMaps: {
        block: (title) => `ad-${title.toLowerCase()}`,
        title: (title) => [`ad-${title.toLowerCase()}-title1`, `ad-${title.toLowerCase()}-title2`],
      },
    },
    assertions(html) {
      const elem = selectOne(
        'blockquote.ad-note > p:first-child > strong.ad-note-title1.ad-note-title2:first-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'Note')
    },
  })

  defineCase('should accept custom title filter', {
    input: `\
# Admonitions
> **Tips**
> test
`,
    config: {
      titleFilter: ['Tips', 'Hints'],
    },
    assertions(html) {
      const elem = selectOne(
        'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'Tips')
    },
  })

  defineCase('should accept custom title filter with functions', {
    input: `\
# Admonitions
> **tIps**
> test
`,
    config: {
      titleFilter: (title) => title.substring(0, 3) == 'tIp',
    },
    assertions(html) {
      const elem = selectOne(
        'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'tIps')
    },
  })

  defineCase('should accept title lift', {
    input: `\
# Admonitions
> **Note**
> test
`,
    config: {
      titleLift: true,
    },
    assertions(html) {
      const elem = selectOne(
        'blockquote.admonition > p:first-child > strong.admonition-title:only-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'Note')
    },
  })

  defineCase('should accept title lift with other whitespaces', {
    input: `\
# Admonitions
> **Note** \t
> test
`,
    config: {
      titleLift: true,
    },
    assertions(html) {
      const doc = parseDocument(html)
      const titleElem = selectOne('blockquote.admonition > p:first-child > strong.admonition-title:only-child', doc)
      expect(titleElem).to.have.nested.property('firstChild.data', 'Note')
      const textElem = selectOne('blockquote.admonition > p:nth-child(2)', doc)
      expect(textElem)
        .to.have.nested.property('firstChild.data')
        .and.to.satisfy((data: string) => data.startsWith('test'))
    },
  })

  defineCase('should accept title lift with custom whitespace handling', {
    input: `\
# Admonitions
> **Note**
> test
`,
    config: {
      titleLift: true,
      titleLiftWhitespaces: () => 'a',
    },
    assertions(html) {
      const doc = parseDocument(html)
      const titleElem = selectOne('blockquote.admonition > p:first-child > strong.admonition-title:only-child', doc)
      expect(titleElem).to.have.nested.property('firstChild.data', 'Note')
      const textElem = selectOne('blockquote.admonition > p:nth-child(2)', doc)
      expect(textElem)
        .to.have.nested.property('firstChild.data')
        .and.to.satisfy((data: string) => data.startsWith('atest'))
    },
  })

  defineCase('should accept title unwrap', {
    input: `\
# Admonitions
> **Note**
> test
`,
    config: {
      titleLift: true,
      titleUnwrap: true,
    },
    assertions(html) {
      const elem = selectOne('blockquote.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'Note')
    },
  })

  defineCase('should accept title text map to customize title text', {
    input: `\
# Admonitions
> **Note:OKOK**
> test
`,
    config: {
      titleFilter: (title) => title.startsWith('Note:'),
      titleTextMap: (title) => {
        const titleSplit = title.split(':')
        return { displayTitle: titleSplit[1], checkedTitle: titleSplit[0] }
      },
    },
    assertions(html) {
      const elem = selectOne(
        'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'OKOK')
    },
  })

  defineCase('should accept data maps to edit data', {
    input: `\
# Admonitions
> **Note**
> test
`,
    config: {
      dataMaps: {
        block: (data) => ({ ...data, hName: 'div' }),
        title: (data) => data,
      },
    },
    assertions(html) {
      const elem = selectOne(
        'div.admonition > p:first-child > strong.admonition-title:first-child',
        parseDocument(html)
      )
      expect(elem).to.have.nested.property('firstChild.data', 'Note')
    },
  })
})

describe('MkDocs admonition HTML options for legacy titles like **Note**', function () {
  defineCase('should transform', {
    input: `\
# Admonitions
> **note danger "Don't try this at home"**
> You should note that the title will be automatically capitalized.
`,
    config: mkdocsConfig,
    assertions(html) {
      const elem = selectOne('div.admonition.note.danger > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', "Don't try this at home")
    },
  })

  defineCase('should transform with custom types', {
    input: `\
# Admonitions
> **admonition: guess "Don't try this at home"**
> You should note that the title will be automatically capitalized.
`,
    config: mkdocsConfig,
    assertions(html) {
      const doc = parseDocument(html)
      const elem = selectOne('div.admonition.guess > p.admonition-title:first-child', doc)
      expect(elem).to.have.nested.property('firstChild.data', "Don't try this at home")
      const elemUnexpected = selectOne('div.admonition.admonition\\:', doc)
      expect(elemUnexpected).to.be.null
    },
  })
})
