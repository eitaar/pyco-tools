// ==UserScript==
// @name         PyCo Challenge Extractor
// @namespace    https://github.com/eitaar/pyco-tools
// @version      1.1.0
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
    const MAX_LESSON = 99;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function challengeKeyForLesson(lessonNumber) {
        return `lesson${String(lessonNumber).padStart(2, "0")}Challenges`;
    }

    function readPageGlobal(name) {
        if (!/^lesson\d+Challenges$/.test(name)) {
            throw new Error(`${PREFIX} invalid global name: ${name}`);
        }

        // Same idea as typing e.g. `lesson01Challenges` in DevTools.
        // This also works when the page declared it with top-level let/const,
        // where window[name] / globalThis[name] would be undefined.
        return (0, eval)(name);
    }

    function tryReadPageGlobal(name) {
        try {
            return {
                found: true,
                value: readPageGlobal(name),
            };
        } catch (error) {
            if (error instanceof ReferenceError) {
                return {
                    found: false,
                    value: undefined,
                };
            }

            throw error;
        }
    }

    function scanLessonChallenges(maxLesson = MAX_LESSON) {
        const extracted = {};

        for (let lesson = 1; lesson <= maxLesson; lesson += 1) {
            const key = challengeKeyForLesson(lesson);
            const result = tryReadPageGlobal(key);

            if (result.found) {
                extracted[key] = result.value;
            }
        }

        window.__pycoToolsExtracted = extracted;

        return extracted;
    }

    async function waitForAnyLessonChallenges(timeout = 15000) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const extracted = scanLessonChallenges();

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
        console.log(`${PREFIX} extracted:`, extracted);

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
            const extracted = scanLessonChallenges();
            printExtracted(extracted);
            return extracted;
        }

        const key = challengeKeyForLesson(lessonNumber);
        const result = tryReadPageGlobal(key);

        if (!result.found) {
            throw new Error(`${PREFIX} ${key} is not loaded on this page`);
        }

        window.__pycoToolsExtracted ??= {};
        window.__pycoToolsExtracted[key] = result.value;

        console.log(`${PREFIX} ${key}:`, result.value);
        return result.value;
    };

    async function main() {
        const extracted = await waitForAnyLessonChallenges();
        printExtracted(extracted);
    }

    main().catch(error => {
        console.error(`${PREFIX} error:`, error);
    });
})();
