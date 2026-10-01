# pyco-tools

Small Tampermonkey userscripts for [Python Coach](https://pythoncoach.org/).

## Structure

```text
pyco-tools/
├─ userscripts/
│  ├─ pyco-auto.user.js
│  └─ pyco-extract.user.js
├─ LICENSE
└─ README.md
```

## PyCo Auto

`userscripts/pyco-auto.user.js` automatically:

1. reads the current challenge ID from the URL;
2. takes the answer from `hints[3]`;
3. inserts it into CodeMirror;
4. clicks **Run**;
5. clicks the next/continue button shortly afterwards.

## PyCo Challenge Extractor

`userscripts/pyco-extract.user.js` extracts the current lesson's
`lesson{nn}Challenges` value from Python Coach's page-level global scope.

It:

1. reads the current challenge ID from the URL;
2. derives the corresponding global name, for example `lesson03Challenges`;
3. resolves the value from the page's global lexical scope, including globals
   declared with top-level `let` or `const`;
4. logs the extracted object and its JSON representation to the console;
5. exposes the result as `window.__pycoToolsExtracted[lessonXXChallenges]`.

A helper is also exposed for manually extracting a lesson that is already
loaded on the current page:

```js
await pycoExtractLessonChallenges(3)
```

## Install

1. Install Tampermonkey.
2. Open the desired file under `userscripts/`.
3. Install the userscript.

The userscripts run on Python Coach pages under:

```text
https://pythoncoach.org/*
https://www.pythoncoach.org/*
```

## Disclaimer

This project is unofficial and is not affiliated with or endorsed by Python Coach.

It is provided for educational and experimental purposes only. You are responsible for ensuring that your use of these tools complies with Python Coach's terms and policies, as well as any rules set by your school or institution.

The scripts depend on Python Coach's current page structure and may stop working if the website changes. Use them at your own risk.

## License

MIT
