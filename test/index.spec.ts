import { expect } from 'chai'
import { parseDocument } from 'htmlparser2'
import { selectOne } from 'css-select'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import plugin from '../src/index'

async function mdToHtml(md: string) {
  return String(await remark().use(remarkParse).use(plugin).use(remarkRehype).use(rehypeStringify).process(md))
}

describe('GitHub beta blockquote-based admonitions', function () {
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

  it('should not transform when not strong', async function () {
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
