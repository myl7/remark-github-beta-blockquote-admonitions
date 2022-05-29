# remark-github-beta-blockquote-admonitions

remark plugin to add support for [GitHub beta blockquote-based admonitions](https://github.com/github/feedback/discussions/16925)

If you are viewing the README on NPM, refer to [GitHub README](https://github.com/myl7/remark-github-beta-blockquote-admonitions#readme) for possible documentation update

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
  titleLift: boolean // When enabled, the <strong> element will be moved from <p> children to <blockquote> children with <p> wrapped, like the structure of MkDocs admonitions, otherwise no extra actions
  titleLiftWhitespaces?: (whitespaces: string) => string // When titleLift is enabled, after <strong> is moved, the function defines what the whitespaces following the <strong> will be converted to. By default, remove these whitespaces. You may rarely need to set the option unless want to strictly control the syntax tree.
  titleUnwrap: boolean // When titleLift is enabled, other than wrapping <strong> with <p>, use the title text to build a <p> with classes and put it into <blockquote> children to serve as admonition title, which makes the structure be like MkDocs admonitions more
  titleTextMap: (title: string) => { displayTitle: string; checkedTitle: string } // The function allows you to differ displayed title text in the output with the one checked in the plugin such as whether the block is an admonition and the classes the plugin is going to add. The differing is done before all checks. This may help you to embed custom title text with particular admonition type like "**Note/My Title**". By default, both two variables use the same original value.
  dataMaps: { // Customize block node and title node data in mdast syntax tree. For example, if you want the block to be <div> other than <blockquote>, with [the help of remark-rehype](https://github.com/syntax-tree/mdast-util-to-hast#fields-on-nodes), you can set { hName: 'div' } for block to implement it. By default, no extra actions.
    block: (data: Data) => Data
    title: (data: Data) => Data
  }
}
export const defaultConfig: Config = {
  classNameMaps: {
    block: 'admonition',
    title: 'admonition-title',
  },
  titleFilter: ['Note', 'Warning'],
  titleLift: false,
  titleLiftWhitespaces: () => '',
  titleUnwrap: false,
  titleTextMap: title => ({ displayTitle: title, checkedTitle: title }),
  dataMaps: {
    block: data => data,
    title: data => data,
  },
}
```

Notice: The default config and provided config are merged simply with `{ ...a, ...b }`, so for example if you are going to provide a customized `classNameMaps`, you need to provide both `block` and `title`.

## How To

### Collaborate with MkDocs admonitions?

[MkDocs admonitions](https://www.markdownguide.org/tools/mkdocs/#using-admonitions) is just [Python-Markdown admonitions](https://python-markdown.github.io/extensions/admonition/) which is from [rST-style admonitions](https://docutils.sourceforge.io/docs/ref/rst/directives.html#specific-admonitions)

A MkDocs-campatibility-focused config `mkdocsConfig` is already provided within the package.
The config will make the output HTML the same as the MkDocs admonition HTML.
Custom admonition types are also supported by prefixing it with `admonition:` and a space.
Examples are:

<table>
  <tr>
    <td>GitHub beta blockquote-based</td>
    <td>MkDocs</td>
    <td>HTML</td>
  </tr>
  <tr>
    <td>

```md
> **note danger "Don't try this at home"**
> You should note that the title will be automatically capitalized.
```

</td><td>

```md
!!! note danger "Don't try this at home"
    You should note that the title will be automatically capitalized.
```

</td><td>

```html
<div class="admonition note danger">
  <p class="admonition-title">Don't try this at home</p>
  <p>You should note that the title will be automatically capitalized.</p>
</div>
```

</td>
</tr>
<tr>
    <td>

```md
> **admonition: guess "Don't try this at home"**
> You should note that the title will be automatically capitalized.
```

</td><td>

```md
!!! guess "Don't try this at home"
    You should note that the title will be automatically capitalized.
```

</td><td>

```html
<div class="admonition guess">
  <p class="admonition-title">Don't try this at home</p>
  <p>You should note that the title will be automatically capitalized.</p>
</div>
```

</td>
</tr>
</table>

Notice: Descriptive title in `""` is required, otherwise it will fallback to empty string `""` other than names corresponding to the types like `Notes` to `note`.

## Implementation

Since GitHub beta blockquote-based admonitions are backward compatible in Markdown, things are simple, which are just to visit the matched elements in the `remark-parse` parsed syntax tree to add `remark-rehype` recognizable classes

## License

Copyright 2022 myl7

SPDX-License-Identifier: Apache-2.0
