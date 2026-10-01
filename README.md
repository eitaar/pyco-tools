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

`userscripts/pyco-extract.user.js` extracts loaded globals such as
`lesson01Challenges` directly from `globalThis`, using the same access
method as `pyco-auto.user.js`.

It automatically detects loaded globals matching:

```text
lesson{nn}Challenges
```

and logs each value plus a JSON representation to the console. Extracted
values are also stored in:

```js
window.__pycoToolsExtracted
```

Manual helpers are available too:

```js
pycoExtractLessonChallenges()
pycoExtractLessonChallenges(1)
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
