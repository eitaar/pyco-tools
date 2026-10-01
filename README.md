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

`userscripts/pyco-extract.user.js` does not inspect the DOM or wait for page globals.
It fetches Python Coach's static challenge files directly:

```text
/js/challenges/lesson-01-challenges.js
/js/challenges/lesson-02-challenges.js
...
/js/challenges/lesson-99-challenges.js
```

Each file is expected to contain a declaration such as:

```js
var lesson01Challenges = { ... };
```

The challenge file is parsed as JavaScript because the object literals are not always strict JSON. The detected challenge object is then merged and serialized with `JSON.stringify()` for the final JSON output.

### Run

1. Open any page on `pythoncoach.org`.
2. Open the Tampermonkey menu.
3. Choose **Fetch all challenges**.
4. All available lessons are fetched and merged by challenge ID.
5. The final JSON is printed to DevTools and copied to the clipboard.

Use **Copy last JSON** to copy the most recent result again without refetching.

Missing lesson files (`404`) are skipped. Other fetch or parse errors are reported in the console.
## Install

1. Install Tampermonkey.
2. Open the raw userscript URL (recommended) or the desired file under `userscripts/`.
3. Install the userscript.
4. Existing installs of `pyco-extract.user.js` can update from the raw GitHub URL via the userscript metadata.

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
