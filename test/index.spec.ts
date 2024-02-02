// Copyright (C) myl7
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest'
import { parseDocument } from 'htmlparser2'
import { selectOne, selectAll } from 'css-select'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import plugin, { Config, mkdocsConfig } from '../src/index.js'

function defineCase(
  name: string,
  options: {
    input: string
    assertions: (html: string) => Promise<void> | void
    config?: Partial<Config>
  },
) {
  it(name, async function () {
    const processor = remark()
      .use(remarkParse)
      // To make unified happy, since it does not allow (for types) to pass an undefined as config.
      // This test code can also handle the difference between `.use(plugin)` and `.use(plugin, {})`.
      .use(plugin, ...(options.config ? [options.config] : []))
      .use(remarkRehype)
      .use(rehypeStringify)

    const html = String(await processor.process(options.input))
    await options.assertions(html)

    expect(html).toMatchSnapshot()
  })
}

describe('GitHub beta blockquote-based admonitions with titles like [!NOTE]', function () {
  defineCase('should transform', {
    input: `\
# Admonitions
> [!NOTE]
> test
`,
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
    },
  })

  defineCase('should not transform when single line', {
    input: `\
# Admonitions
> [!NOTE] test
`,
    assertions(html) {
      const elem = selectOne('div.admonition', parseDocument(html))
      expect(elem).to.have.be.null
    },
  })

  defineCase('should transform with nested ones', {
    input: `\
# Admonitions
> [!NOTE]
> test
>
> > [!NOTE]
> > test
> >
> > > [!WARNING]
> > > test
`,
    assertions(html) {
      const elem = selectOne(
        'div.admonition > div.admonition > div.admonition > p.admonition-title:first-child',
        parseDocument(html),
      )
      expect(elem).to.have.nested.property('firstChild.data', 'WARNING')
    },
  })

  defineCase('should transform with unordered lists from issue #4', {
    input: `\
# Admonitions
> [!NOTE]
> - Here you go
> - Here you go again
> - Here you go one more time
`,
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
    },
  })

  defineCase('should transform with ordered lists from issue #4', {
    input: `\
# Admonitions
> [!NOTE]
> 1. Here you go
> 2. Here you go again
> 3. Here you go one more time
`,
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
    },
  })

  defineCase('should not transform when title is not in form [!NOTE] but legacy **Note**', {
    input: `\
# Admonitions
> **Note**
> test
`,
    assertions(html) {
      const elem = selectOne('div.admonition', parseDocument(html))
      expect(elem).to.be.null
    },
  })

  defineCase('should transform with title with trailing whitespaces to be trimmed', {
    input: `\
# Admonitions
> [!NOTE] \r\t\v\

> test
`,
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
    },
  })

  defineCase('should transform GitHub example (until 2024-01-02) with default config', {
    input: `\
# Admonitions
> [!NOTE]
> Highlights information that users should take into account, even when skimming.

> [!TIP]
> Optional information to help a user be more successful.

> [!IMPORTANT]
> Crucial information necessary for users to succeed.

> [!WARNING]
> Critical content demanding immediate user attention due to potential risks.

> [!CAUTION]
> Negative potential consequences of an action.
`,
    assertions(html) {
      const elems = selectAll('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elems).to.have.lengthOf(5)
      expect(elems[0]).to.have.nested.property('firstChild.data', 'NOTE')
      expect(elems[1]).to.have.nested.property('firstChild.data', 'TIP')
      expect(elems[2]).to.have.nested.property('firstChild.data', 'IMPORTANT')
      expect(elems[3]).to.have.nested.property('firstChild.data', 'WARNING')
      expect(elems[4]).to.have.nested.property('firstChild.data', 'CAUTION')
    },
  })

  defineCase('should transform when title has 2 trailing spaces from issue #12', {
    input:
      '# Admonitions  \n' +
      '> [!WARNING]\n' +
      '> Critical content demanding immediate user attention due to potential risks.\n',
    config: {
      classNameMaps: {
        block: (title: string) => `admonition admonition--${title.toLowerCase()}`,
        title: (title: string) => `admonition-title admonition-title--${title.toLowerCase()}`,
      },

      titleTextMap: (title: string) => {
        // Removes `![]`
        let displayTitle = title.slice(2, -1)
        // Capitalize
        displayTitle = `${displayTitle.at(0)}${displayTitle.substring(1).toLowerCase()}`
        return {
          displayTitle,
          checkedTitle: displayTitle,
        }
      },
    },
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'Warning')
    },
  })
})

describe('the plugin options for titles like [!NOTE]', function () {
  defineCase('should accept custom class names', {
    input: `\
# Admonitions
> [!NOTE]
> test
`,
    config: {
      classNameMaps: {
        block: 'ad',
        title: ['ad-title1', 'ad-title2'],
      },
    },
    assertions(html) {
      const elem = selectOne('div.ad > p.ad-title1.ad-title2:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
    },
  })

  defineCase('should accept custom class names with functions', {
    input: `\
# Admonitions
> [!NOTE]
> test
`,
    config: {
      classNameMaps: {
        block: (title) => `ad-${title.toLowerCase()}`,
        title: (title) => [`ad-${title.toLowerCase()}-title1`, `ad-${title.toLowerCase()}-title2`],
      },
    },
    assertions(html) {
      const elem = selectOne('div.ad-note > p.ad-note-title1.ad-note-title2:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
    },
  })

  defineCase('should accept custom title filter', {
    input: `\
# Admonitions
> [!TIPS]
> test
`,
    config: {
      titleFilter: ['[!TIPS]', '[!HINTS]'],
    },
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'TIPS')
    },
  })

  defineCase('should accept custom title filter with functions', {
    input: `\
# Admonitions
> [!tIps]
> test
`,
    config: {
      titleFilter: (title) => title.startsWith('[!tIp') && title.endsWith(']'),
    },
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'tIps')
    },
  })

  defineCase('should accept title text map to customize title text', {
    input: `\
# Admonitions
> [!NOTE:OKOK]
> test
`,
    config: {
      titleFilter: (title) => title.startsWith('[!NOTE:') && title.endsWith(']'),
      titleTextMap: (title) => {
        const titleSplit = title.substring(2, title.length - 1).split(':')
        return { displayTitle: titleSplit[1], checkedTitle: titleSplit[0] }
      },
    },
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'OKOK')
    },
  })

  defineCase('should accept title text map to customize title text with spaces', {
    input: `\
# Admonitions
> [!NOTE: OK OK ]
> test
`,
    config: {
      titleFilter: (title) => title.startsWith('[!NOTE:') && title.endsWith(']'),
      titleTextMap: (title) => {
        const titleSplit = title.substring(2, title.length - 1).split(':')
        return { displayTitle: titleSplit[1], checkedTitle: titleSplit[0] }
      },
    },
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', ' OK OK ')
    },
  })

  defineCase('should accept data maps to edit data', {
    input: `\
# Admonitions
> [!NOTE]
> test
`,
    config: {
      dataMaps: {
        block: (data) => ({ ...data, hName: 'admonition' }),
        title: (data) => data,
      },
    },
    assertions(html) {
      const elem = selectOne('admonition.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
    },
  })

  defineCase('should accept title with trailing whitespaces with custom whitespace handling', {
    input: `\
# Admonitions
> [!NOTE] \t\v\

> test
`,
    config: {
      titleFilter: (title) => title.startsWith('[!NOTE]'),
      titleTextMap: (title) => ({
        displayTitle: title.substring(2, title.length - 1 - 3),
        checkedTitle: title.substring(2, title.length - 1 - 3),
      }),
      titleKeepTrailingWhitespaces: true,
    },
    assertions(html) {
      const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
      expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
    },
  })
})

describe('MkDocs admonition HTML options for titles like [!NOTE]', function () {
  defineCase('should transform', {
    input: `\
# Admonitions
> [!note danger "Don't try this at home"]
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
> [!admonition: guess "Don't try this at home"]
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
