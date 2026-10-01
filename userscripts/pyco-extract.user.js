// ==UserScript==
// @name         PyCo Challenge Extractor
// @namespace    https://github.com/eitaar/pyco-tools
// @version      1.2.0
// @description  Extracts loaded lessonXXChallenges globals from Python Coach.
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
        return `lesson${String(lessonNumber).padStart(2, "0")}Challenges`;
    }

    function readGlobal(name) {
        return globalThis[name];
    }

    function findLoadedChallengeGlobals() {
        return Object.getOwnPropertyNames(globalThis)
            .filter(name => /^lesson\d+Challenges$/.test(name))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    function extractLoadedChallengeGlobals() {
        const extracted = {};

        for (const name of findLoadedChallengeGlobals()) {
            const value = readGlobal(name);

            if (value !== undefined) {
                extracted[name] = value;
            }
        }

        window.__pycoToolsExtracted = extracted;
        return extracted;
    }

    async function waitForAnyLessonChallenges(timeout = 15000) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const extracted = extractLoadedChallengeGlobals();

            if (Object.keys(extracted).length > 0) {
                return extracted;
            }

            await sleep(100);
        }

        throw new Error(`${PREFIX} no lessonXXChallenges global found`);
    }

    function printExtracted(extracted) {
        const keys = Object.keys(extracted);

        console.log(`${PREFIX} found ${keys.length} lesson global(s):`, keys);

        for (const [key, challenges] of Object.entries(extracted)) {
            console.log(`${PREFIX} ${key}:`, challenges);

            try {
                console.log(
                    `${PREFIX} JSON for ${key}:\n${JSON.stringify(challenges, null, 2)}`,
                );
            } catch (error) {
                console.warn(`${PREFIX} could not stringify ${key}:`, error);
            }
        }
    }

    // Manual helpers:
    // pycoExtractLessonChallenges()
    // pycoExtractLessonChallenges(1)
    window.pycoExtractLessonChallenges = lessonNumber => {
        if (lessonNumber === undefined) {
            const extracted = extractLoadedChallengeGlobals();
            printExtracted(extracted);
            return extracted;
        }

        const key = challengeKeyForLesson(lessonNumber);
        const challenges = readGlobal(key);

        if (challenges === undefined) {
            throw new Error(`${PREFIX} ${key} is not loaded on this page`);
        }

        window.__pycoToolsExtracted ??= {};
        window.__pycoToolsExtracted[key] = challenges;

        console.log(`${PREFIX} ${key}:`, challenges);
        return challenges;
    };

    async function main() {
        const extracted = await waitForAnyLessonChallenges();
        printExtracted(extracted);
    }

    main().catch(error => {
        console.error(`${PREFIX} error:`, error);
    });
})();
