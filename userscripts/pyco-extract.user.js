// ==UserScript==
// @name         PyCo Challenge Extractor
// @namespace    https://github.com/eitaar/pyco-tools
// @version      1.0.0
// @description  Extracts the current lessonXXChallenges global from Python Coach.
// @match        https://pythoncoach.org/*
// @match        https://www.pythoncoach.org/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
    "use strict";

    const PREFIX = "[PyCo Extractor]";

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function challengeKeyForLesson(lessonNumber) {
        const lesson = String(lessonNumber).padStart(2, "0");

        if (!/^\d{2,}$/.test(lesson)) {
            throw new Error(`${PREFIX} invalid lesson number: ${lessonNumber}`);
        }

        return `lesson${lesson}Challenges`;
    }

    function currentLessonNumber() {
        const id = new URLSearchParams(location.search).get("id");

        if (!id || !/^\d{2,}$/.test(id)) {
            return null;
        }

        return id.slice(0, -1);
    }

    function readPageGlobal(name) {
        if (!/^lesson\d+Challenges$/.test(name)) {
            throw new Error(`${PREFIX} refusing to evaluate unexpected global name: ${name}`);
        }

        // Important: lessonXXChallenges may be a top-level let/const binding.
        // In that case it exists in the page's global lexical environment but is
        // not available as window[name] / globalThis[name].
        return (0, eval)(name);
    }

    async function waitForPageGlobal(name, timeout = 15000) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            try {
                const value = readPageGlobal(name);

                if (value !== undefined) {
                    return value;
                }
            } catch (error) {
                if (!(error instanceof ReferenceError)) {
                    throw error;
                }
            }

            await sleep(100);
        }

        throw new Error(`${PREFIX} timed out waiting for ${name}`);
    }

    async function extractLessonChallenges(lessonNumber, timeout = 15000) {
        const key = challengeKeyForLesson(lessonNumber);
        const challenges = await waitForPageGlobal(key, timeout);

        window.__pycoToolsExtracted ??= {};
        window.__pycoToolsExtracted[key] = challenges;

        console.log(`${PREFIX} extracted ${key}:`, challenges);

        try {
            console.log(`${PREFIX} JSON for ${key}:\n${JSON.stringify(challenges, null, 2)}`);
        } catch (error) {
            console.warn(`${PREFIX} could not stringify ${key}:`, error);
        }

        return challenges;
    }

    // Expose a manual helper in case you want to request a specific loaded lesson:
    // await pycoExtractLessonChallenges(3)
    window.pycoExtractLessonChallenges = extractLessonChallenges;

    async function main() {
        const lessonNumber = currentLessonNumber();

        if (lessonNumber === null) {
            console.log(`${PREFIX} no challenge id in the URL; helper installed as pycoExtractLessonChallenges()`);
            return;
        }

        await extractLessonChallenges(lessonNumber);
    }

    main().catch(error => {
        console.error(`${PREFIX} error:`, error);
    });
})();
