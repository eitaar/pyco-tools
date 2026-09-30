# pyco-tool

Small Tampermonkey userscripts for PyCo.

## Structure

```text
pyco-tool/
├─ userscripts/
│  └─ pyco-auto.user.js
├─ LICENSE
└─ README.md
```

## PyCo Auto

`userscripts/pyco-auto.user.js` automatically:

1. reads the current challenge ID from the URL;
2. takes the answer from `hints[3]`;
3. inserts it into CodeMirror;
4. clicks **Run**;
5. clicks the next/continue button one second later.

Because the site is not an SPA, Tampermonkey runs the userscript again after each full page navigation.

## Install

1. Install Tampermonkey.
2. Open `userscripts/pyco-auto.user.js`.
3. Install the userscript.
4. Replace the placeholder `@match` URL with the actual PyCo challenge URL pattern.

Example:

```js
// @match        https://example.com/*
```

## License

MIT
