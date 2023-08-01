// Copyright (C) myl7
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import { parseDocument } from 'htmlparser2'
import { selectOne } from 'css-select'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import plugin, { Config, mkdocsConfig } from '../src'

async function mdToHtml(md: string, options?: Partial<Config>) {
  return String(await remark().use(remarkParse).use(plugin, options).use(remarkRehype).use(rehypeStringify).process(md))
}

describe('GitHub beta blockquote-based admonitions with titles like [!NOTE]', function () {
  it('should transform', async function () {
    const html = await mdToHtml(`\
# Admonitions
> [!NOTE]
> test
`)
    const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
  })

  it('should not transform when single line', async function () {
    const html = await mdToHtml(`\
# Admonitions
> [!NOTE] test
`)
    const elem = selectOne('div.admonition', parseDocument(html))
    expect(elem).to.have.be.null
  })

  it('should transform with nested ones', async function () {
    const html = await mdToHtml(`\
# Admonitions
> [!NOTE]
> test
>
> > [!NOTE]
> > test
> >
> > > [!WARNING]
> > > test
`)
    const elem = selectOne(
      'div.admonition > div.admonition > div.admonition > p.admonition-title:first-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'WARNING')
  })

  it('should not transform when title is not in form [!NOTE] but legacy **Note**', async function () {
    const html = await mdToHtml(`\
# Admonitions
> **Note**
> test
`)
    const elem = selectOne('div.admonition', parseDocument(html))
    expect(elem).to.be.null
  })
})

describe('the plugin options for titles like [!NOTE]', function () {
  it('should accept custom class names', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> [!NOTE]
> test
`,
      {
        classNameMaps: {
          block: 'ad',
          title: ['ad-title1', 'ad-title2'],
        },
      }
    )
    const elem = selectOne('div.ad > p.ad-title1.ad-title2:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
  })

  it('should accept custom class names with functions', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> [!NOTE]
> test
`,
      {
        classNameMaps: {
          block: (title) => `ad-${title.toLowerCase()}`,
          title: (title) => [`ad-${title.toLowerCase()}-title1`, `ad-${title.toLowerCase()}-title2`],
        },
      }
    )
    const elem = selectOne('div.ad-note > p.ad-note-title1.ad-note-title2:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
  })

  it('should accept custom title filter', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> [!TIPS]
> test
`,
      {
        titleFilter: ['TIPS', 'HINTS'],
      }
    )
    const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', 'TIPS')
  })

  it('should accept custom title filter with functions', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> [!tIps]
> test
`,
      {
        titleFilter: (title) => title.substring(0, 3) == 'tIp',
      }
    )
    const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', 'tIps')
  })

  it('should accept title text map to customize title text', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> [!NOTE:OKOK]
> test
`,
      {
        titleTextMap: (title) => {
          const titleSplit = title.substring(2, title.length - 1).split(':')
          return { displayTitle: titleSplit[1], checkedTitle: titleSplit[0] }
        },
      }
    )
    const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', 'OKOK')
  })

  it('should accept title text map to customize title text with spaces', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> [!NOTE: OK OK ]
> test
`,
      {
        titleTextMap: (title) => {
          const titleSplit = title.substring(2, title.length - 1).split(':')
          return { displayTitle: titleSplit[1], checkedTitle: titleSplit[0] }
        },
      }
    )
    const elem = selectOne('div.admonition > p.admonition-title:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', ' OK OK ')
  })

  it('should accept data maps to edit data', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> [!NOTE]
> test
`,
      {
        dataMaps: {
          block: (data) => ({ ...data, hName: 'admonition' }),
          title: (data) => data,
        },
      }
    )
    const elem = selectOne('admonition.admonition > p.admonition-title:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', 'NOTE')
  })
})

describe('MkDocs admonition HTML options for titles like [!NOTE]', function () {
  it('should transform', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> [!note danger "Don't try this at home"]
> You should note that the title will be automatically capitalized.
`,
      mkdocsConfig
    )
    const elem = selectOne('div.admonition.note.danger > p.admonition-title:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', "Don't try this at home")
  })

  it('should transform with custom types', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> [!admonition: guess "Don't try this at home"]
> You should note that the title will be automatically capitalized.
`,
      mkdocsConfig
    )
    const doc = parseDocument(html)
    const elem = selectOne('div.admonition.guess > p.admonition-title:first-child', doc)
    expect(elem).to.have.nested.property('firstChild.data', "Don't try this at home")
    const elemUnexpected = selectOne('div.admonition.admonition\\:', doc)
    expect(elemUnexpected).to.be.null
  })
})
