
// ==UserScript==
// @name         PyCo Tools
// @namespace    https://github.com/eitaar/pyco-tools
// @version      1.0.2
// @description  Automatically fills, runs, and advances PythonCoach challenges.
// @match        https://pythoncoach.org/*
// @match        https://www.pythoncoach.org/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
    "use strict";
    console.log("[PyCo Tools] loaded:", location.href);
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function waitForElement(selector, timeout = 10000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const element = document.querySelector(selector);
            if (element) {return element;}
            await sleep(100);
        }
        throw new Error(`[PyCo Tools] timed out waiting for element: ${selector}`);
    }

    async function waitForGlobal(name, timeout = 10000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const value = globalThis[name];
            if (value !== undefined) {return value;}
            await sleep(100);
        }
        throw new Error(`[PyCo Tools] timed out waiting for global: ${name}`);
    }

    async function main() {
        const id = new URLSearchParams(location.search).get("id");
        console.log("[PyCo Tools] challenge id:", id);
        if (!id) {
            console.log("[PyCo Tools] not a challenge page");
            return;
        }
        const lesson = id.slice(0, -1);
        const challengeKey =`lesson${lesson.padStart(2, "0")}Challenges`;

        console.log("[PyCo Tools] waiting for challenge variable:",challengeKey);
        const challenges =await waitForGlobal(challengeKey, 15000);

        console.log("[PyCo Tools] challenge variable ready:",challenges);
        const challenge = challenges[id];
        if (!challenge) {
            throw new Error(`[PyCo Tools] challenge ${id} not found`);
        }
        console.log("[PyCo Tools] challenge:",challenge);
        const answer = challenge.hints?.[3];
        if (!answer) {
            throw new Error(`[PyCo Tools] hints[3] not found for ${id}`);
        }

        const codeMirrorElement = await waitForElement(".CodeMirror", 15000);
        const cm = codeMirrorElement.CodeMirror;

        if (!cm) {
            throw new Error("[PyCo Tools] CodeMirror instance not found");
        }
        console.log("[PyCo Tools] inserting answer:",id);
        
        cm.setValue(answer);

        const runButton = await waitForElement("#ch-run-btn", 10000);

        console.log("[PyCo Tools] clicking Run");
        runButton.click();

        const nextButton = await waitForElement(".ch-hub-cta-btn",15000);
        console.log("[PyCo Tools] next button found:",nextButton);

        await sleep(500);
        console.log("[PyCo Tools] advancing");
        nextButton.click();
    }

    main().catch(error => {
        console.error("[PyCo Tools] error:",error);
    });
})();
