// Copyright (C) myl7
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import { parseDocument } from 'htmlparser2'
import { selectOne } from 'css-select'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import plugin, { ConfigForLegacyTitle as Config, mkdocsConfigForLegacyTitle as mkdocsConfig } from '../src/index.js'

async function mdToHtml(md: string, options?: Partial<Config>) {
  const optionsForLegacyTitle = { ...options, legacyTitle: true }
  return String(
    await remark()
      .use(remarkParse)
      .use(plugin, optionsForLegacyTitle)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(md)
  )
}

describe('GitHub beta blockquote-based admonitions with legacy titles like **Note**', function () {
  it('should transform', async function () {
    const html = await mdToHtml(`\
# Admonitions
> **Note**
> test
`)
    const elem = selectOne(
      'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'Note')
  })

  it('should transform when single line', async function () {
    const html = await mdToHtml(`\
# Admonitions
> **Note** test
`)
    const elem = selectOne(
      'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'Note')
  })

  it('should transform with nested ones', async function () {
    const html = await mdToHtml(`\
# Admonitions
> **Note**
> test
>
> > **Note**
> > test
> >
> > > **Warning**
> > > test
`)
    const elem = selectOne(
      'blockquote.admonition > blockquote.admonition > blockquote.admonition > p:first-child > strong.admonition-title:first-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'Warning')
  })

  it('should not transform when title is not strong', async function () {
    const html = await mdToHtml(`\
# Admonitions
> *Note*
> test
`)
    const elem = selectOne(
      'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
      parseDocument(html)
    )
    expect(elem).to.be.null
  })
})

describe('the plugin options for legacy titles like **Note**', function () {
  it('should accept custom class names', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **Note**
> test
`,
      {
        classNameMaps: {
          block: 'ad',
          title: ['ad-title1', 'ad-title2'],
        },
      }
    )
    const elem = selectOne(
      'blockquote.ad > p:first-child > strong.ad-title1.ad-title2:first-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'Note')
  })

  it('should accept custom class names with functions', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **Note**
> test
`,
      {
        classNameMaps: {
          block: (title) => `ad-${title.toLowerCase()}`,
          title: (title) => [`ad-${title.toLowerCase()}-title1`, `ad-${title.toLowerCase()}-title2`],
        },
      }
    )
    const elem = selectOne(
      'blockquote.ad-note > p:first-child > strong.ad-note-title1.ad-note-title2:first-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'Note')
  })

  it('should accept custom title filter', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **Tips**
> test
`,
      {
        titleFilter: ['Tips', 'Hints'],
      }
    )
    const elem = selectOne(
      'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'Tips')
  })

  it('should accept custom title filter with functions', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **tIps**
> test
`,
      {
        titleFilter: (title) => title.substring(0, 3) == 'tIp',
      }
    )
    const elem = selectOne(
      'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'tIps')
  })

  it('should accept title lift', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **Note**
> test
`,
      {
        titleLift: true,
      }
    )
    const elem = selectOne(
      'blockquote.admonition > p:first-child > strong.admonition-title:only-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'Note')
  })

  it('should accept title lift with other whitespaces', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **Note** \t
> test
`,
      {
        titleLift: true,
      }
    )
    const doc = parseDocument(html)
    const titleElem = selectOne('blockquote.admonition > p:first-child > strong.admonition-title:only-child', doc)
    expect(titleElem).to.have.nested.property('firstChild.data', 'Note')
    const textElem = selectOne('blockquote.admonition > p:nth-child(2)', doc)
    expect(textElem)
      .to.have.nested.property('firstChild.data')
      .and.to.satisfy((data: string) => data.startsWith('test'))
  })

  it('should accept title lift with custom whitespace handling', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **Note**
> test
`,
      {
        titleLift: true,
        titleLiftWhitespaces: () => 'a',
      }
    )
    const doc = parseDocument(html)
    const titleElem = selectOne('blockquote.admonition > p:first-child > strong.admonition-title:only-child', doc)
    expect(titleElem).to.have.nested.property('firstChild.data', 'Note')
    const textElem = selectOne('blockquote.admonition > p:nth-child(2)', doc)
    expect(textElem)
      .to.have.nested.property('firstChild.data')
      .and.to.satisfy((data: string) => data.startsWith('atest'))
  })

  it('should accept title unwrap', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **Note**
> test
`,
      {
        titleLift: true,
        titleUnwrap: true,
      }
    )
    const elem = selectOne('blockquote.admonition > p.admonition-title:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', 'Note')
  })

  it('should accept title text map to customize title text', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **Note:OKOK**
> test
`,
      {
        titleFilter: (title) => title.startsWith('Note:'),
        titleTextMap: (title) => {
          const titleSplit = title.split(':')
          return { displayTitle: titleSplit[1], checkedTitle: titleSplit[0] }
        },
      }
    )
    const elem = selectOne(
      'blockquote.admonition > p:first-child > strong.admonition-title:first-child',
      parseDocument(html)
    )
    expect(elem).to.have.nested.property('firstChild.data', 'OKOK')
  })

  it('should accept data maps to edit data', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **Note**
> test
`,
      {
        dataMaps: {
          block: (data) => ({ ...data, hName: 'div' }),
          title: (data) => data,
        },
      }
    )
    const elem = selectOne('div.admonition > p:first-child > strong.admonition-title:first-child', parseDocument(html))
    expect(elem).to.have.nested.property('firstChild.data', 'Note')
  })
})

describe('MkDocs admonition HTML options for legacy titles like **Note**', function () {
  it('should transform', async function () {
    const html = await mdToHtml(
      `\
# Admonitions
> **note danger "Don't try this at home"**
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
> **admonition: guess "Don't try this at home"**
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
