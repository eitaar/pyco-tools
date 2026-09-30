# pyco-tools

Small Tampermonkey userscripts for [Python Coach](https://pythoncoach.org/).

## Structure

```text
pyco-tools/
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

## Install

1. Install Tampermonkey.
2. Open `userscripts/pyco-auto.user.js`.
3. Install the userscript.

The userscript runs on:

```text
https://pythoncoach.org/challange
```

## License

MIT
