# remark-github-beta-blockquote-admonitions

remark plugin to add support for [GitHub beta blockquote-based admonitions](https://github.com/github/feedback/discussions/16925)

## Get Started

```js
import plugin from 'remark-github-beta-blockquote-admonitions'

const options = {} // Plugin options
const html = String(
  await remark().use(remarkParse).use(plugin, options).use(remarkRehype).use(rehypeStringify).process(`\
# Admonitions
> **Note**
> test
`)
)
/* The output HTML will be:
<h1>Admonitions</h1>
<blockquote class="admonition">
<p><strong class="admonition-title">Note</strong>
test</p>
</blockquote>
 */
```

## Config

```ts
export interface Config {
  classNameMaps: {
    block: string | string[] | (title: string) => (string | string[]) // Classes the <blockquote> block should be added with
    title: string | string[] | (title: string) => (string | string[]) // Classes the <strong> title should be added with
  }
  titleFilter: string[] | (title: string) => boolean // Which title texts in <strong> should make the block considered as admonitions
}
```

## License

Copyright 2022 myl7

SPDX-License-Identifier: Apache-2.0
