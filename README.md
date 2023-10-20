# remark-github-beta-blockquote-admonitions

remark plugin to add support for [GitHub beta blockquote-based admonitions](https://github.com/github/feedback/discussions/16925)

If you are viewing the README on NPM, refer to [GitHub README](https://github.com/myl7/remark-github-beta-blockquote-admonitions#readme) for possible documentation update

## Install

This package is [ESM only][esm].
In Node.js (version 16+), install with [npm]:

```sh
npm install remark-github-beta-blockquote-admonitions
```

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://docs.npmjs.com/cli/install

## Get Started

```js
import plugin from 'remark-github-beta-blockquote-admonitions'

const options = {} // Plugin options
const html = String(
  await remark().use(remarkParse).use(plugin, options).use(remarkRehype).use(rehypeStringify).process(`\
# Admonitions
> [!NOTE]
> test
`)
)
```

The output HTML will be:

```html
<h1>Admonitions</h1>
<div class="admonition">
  <p class="admonition-title">NOTE</p>
  <p>test</p>
</div>
```

The legacy ones with titles like `**Note**` is also and still supported.
Use the option `legacyTitle` to enable it.

## Config

```ts
export interface Config {
  classNameMaps: {
    // Classes the `<div>` block should be added with
    block: string | string[] | (title: string) => (string | string[])
    // Classes the `<p>` title should be added with
    title: string | string[] | (title: string) => (string | string[])
  }
  // Which title texts in `<p>` should make the block considered as admonitions.
  // This is performed before any other actions, e.g., it gets `[!NOTE]`.
  titleFilter: string[] | (title: string) => boolean
  // The function allows you to differ displayed title text in the output with
  // the one checked in the plugin such as the classes the plugin is going to
  // add.
  // The differing is done after the filter check.
  // This may help you to embed custom title text with particular admonition
  // type like "[!Note/My Title]".
  // By default, both two variables use the same value with the prefix`[!` and
  // suffix `]` trimmed.
  titleTextMap: (title: string) => { displayTitle: string; checkedTitle: string }
  // Customize block node and title node data in mdast syntax tree.
  // For example, if you want the block to be `<admonition>` other than `<div>`,
  // with [the help of remark-rehype], you can set `{ hName: 'admonition' }` for
  // block to implement it.
  // By default, no extra actions.
  //
  // [the help of remark-rehype]: https://github.com/syntax-tree/mdast-util-to-hast#fields-on-nodes
  dataMaps: {
    block: (data: Data) => Data
    title: (data: Data) => Data
  }
  // Whether to keep trailing whitespaces of titles, e.g., "[!NOTE] \r\t".
  // Trimmed by default.
  // There is rare need to change it unless you want to strictly control the
  // syntax tree.
  titleKeepTrailingWhitespaces: boolean

  // To use the legacy titles like **Note**
  legacyTitle: boolean
  // The following options only take effects when `legacyTitle == true`.

  // When enabled, the `<strong>` element will be moved from `<p>` children to
  // `<blockquote>` children with `<p>` wrapped, like the structure of MkDocs
  // admonitions, otherwise no extra actions
  titleLift: boolean
  // When titleLift is enabled, after `<strong>` is moved, the function defines
  // what the whitespaces following the `<strong>` will be converted to.
  // By default, remove these whitespaces.
  // You may rarely need to set the option unless want to strictly control the
  // syntax tree.
  titleLiftWhitespaces?: (whitespaces: string) => string
  // When titleLift is enabled, other than wrapping `<strong>` with `<p>`, use
  // the title text to build a `<p>` with classes and put it into `<blockquote>`
  // children to serve as admonition title, which makes the structure be like
  // MkDocs admonitions more
  titleUnwrap: boolean
}
```

The detailed default configuration is:

```js
export const defaultConfig: Config = {
  classNameMaps: {
    block: 'admonition',
    title: 'admonition-title',
  },
  titleFilter: ['[!NOTE]', '[!IMPORTANT]', '[!WARNING]'],
  titleTextMap: (title) => ({
    // To remove the `[!` prefix and `]` suffix
    displayTitle: title.substring(2, title.length - 1),
    checkedTitle: title.substring(2, title.length - 1),
  }),
  dataMaps: {
    block: (data) => data,
    title: (data) => data,
  },
  titleKeepTrailingWhitespaces: false,
  legacyTitle: false,
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
> [!note danger "Don't try this at home"]
> You should note that the title will be automatically capitalized.
```

</td><td>

<!-- prettier-ignore -->
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
> [!admonition: guess "Don't try this at home"]
> You should note that the title will be automatically capitalized.
```

</td><td>

<!-- prettier-ignore -->
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

## Mismatch

The GitHub implementation (so far) will turn "NOTE", "IMPORTANT", "WARNING" to "Note", "Important", "Warning" respectively, but this library will keep the original UPPERCASE form.
This is because this library considers more possible admonition titles like `警告`, `訓戒`, `훈계`, `замечание`, `عتاب` via custom options.
It is hard to determine whether they can be lowercased and what it should be if any.

## Compatibility

**v1 -> v2.0.0**: To avoid breaking previous code that uses titles `**Note**`, you only need to add the option `legacyTitle: true`, replace `mkdocsConfig` with `mkdocsConfigForLegacyTitle`, and no other changes are required.
v2.0.0 is served as an intermediate stage for users who want to support the new title syntax without breaking previous code with minimal changes.

**v2.0.0 -> latest**: The `titleFilter` will be performed before any other actions including `titleTextMap`.
If you just use the default configuration, no changes are required.
If your `titleTextMap` returns `checkedTitle` (i.e., the 2nd returned value) as `title` is, for previous v1 code no changes are required.
Otherwise, since previously `titleFilter` checks `checkedTitle`, now it will check the original `title` (e.g., `[!NOTE]` / `[!admonition: note]`) directly (for both the default `[!NOTE]` title and legacy `**Note**` title).
You may need to update the value of `titleFilter`.

## Implementation

Since GitHub beta blockquote-based admonitions are backward compatible in Markdown, things are simple, which are just to visit the matched elements in the `remark-parse` parsed syntax tree to add `remark-rehype` recognizable classes

## License

Copyright (C) myl7

SPDX-License-Identifier: Apache-2.0
