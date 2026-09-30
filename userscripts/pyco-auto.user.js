// ==UserScript==
// @name         PyCo Tool
// @namespace    https://github.com/eitaar/pyco-tool
// @version      1.0.0
// @description  Automatically fills, runs, and advances PyCo challenges.
// @match        https://example.com/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==

setTimeout(() => {
    const id = new URLSearchParams(window.location.search).get("id");

    const lesson = id.slice(0, -1);
    const challenges = globalThis[`lesson${lesson.padStart(2, "0")}Challenges`];

    let ans = challenges[id].hints[3];
    const cm = document.querySelector(".CodeMirror").CodeMirror;

    cm.setValue(ans);
    document.getElementById("ch-run-btn").click();

    setTimeout(() => {
        document.getElementsByClassName("ch-hub-cta-btn")[0].click();
    }, 1000);
}, 1000);
