// ==UserScript==
// @name         PyCo Challenge Extractor
// @namespace    https://github.com/eitaar/pyco-tools
// @version      1.3.0
// @description  Collects all loaded Python Coach challenge IDs into one JSON object.
// @match        https://pythoncoach.org/*
// @match        https://www.pythoncoach.org/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
    "use strict";

    const PREFIX = "[PyCo Extractor]";
    const TIMEOUT = 15000;
    const STABLE_FOR = 1000;
    const POLL_INTERVAL = 100;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function challengeKeyForLesson(lessonNumber) {
        return `lesson${String(lessonNumber).padStart(2, "0")}Challenges`;
    }

    function findLoadedChallengeGlobals() {
        return Object.getOwnPropertyNames(globalThis)
            .filter(name => /^lesson\d+Challenges$/.test(name))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    function readLoadedLessons() {
        const lessons = {};

        for (const name of findLoadedChallengeGlobals()) {
            const value = globalThis[name];

            if (value !== undefined && value !== null) {
                lessons[name] = value;
            }
        }

        return lessons;
    }

    function flattenChallenges(lessons) {
        const byId = {};

        for (const [lessonName, challenges] of Object.entries(lessons)) {
            if (typeof challenges !== "object" || challenges === null) {
                console.warn(`${PREFIX} skipping non-object ${lessonName}`, challenges);
                continue;
            }

            for (const [id, challenge] of Object.entries(challenges)) {
                if (Object.hasOwn(byId, id)) {
                    console.warn(
                        `${PREFIX} duplicate challenge id ${id}; overwriting previous value`,
                    );
                }

                byId[id] = challenge;
            }
        }

        return Object.fromEntries(
            Object.entries(byId).sort(([a], [b]) =>
                a.localeCompare(b, undefined, { numeric: true }),
            ),
        );
    }

    async function waitUntilLessonGlobalsStable(
        timeout = TIMEOUT,
        stableFor = STABLE_FOR,
    ) {
        const started = Date.now();
        let lastSignature = "";
        let stableSince = null;
        let latest = {};

        while (Date.now() - started < timeout) {
            latest = readLoadedLessons();
            const names = Object.keys(latest);
            const signature = names.join("\n");

            if (names.length > 0) {
                if (signature === lastSignature) {
                    stableSince ??= Date.now();

                    if (Date.now() - stableSince >= stableFor) {
                        return latest;
                    }
                } else {
                    lastSignature = signature;
                    stableSince = Date.now();
                }
            }

            await sleep(POLL_INTERVAL);
        }

        if (Object.keys(latest).length > 0) {
            return latest;
        }

        throw new Error(`${PREFIX} no lessonXXChallenges globals found`);
    }

    function publish(lessons) {
        const byId = flattenChallenges(lessons);
        const json = JSON.stringify(byId, null, 2);

        window.__pycoToolsLessons = lessons;
        window.__pycoToolsAllChallenges = byId;
        window.__pycoToolsJSON = json;

        console.log(
            `${PREFIX} collected ${Object.keys(byId).length} challenge IDs from ${Object.keys(lessons).length} lesson globals`,
        );
        console.log(`${PREFIX} all challenges JSON:\n${json}`);

        return byId;
    }

    // Manual helpers:
    // pycoExtractAllChallenges()
    // pycoExtractLessonChallenges(1)
    window.pycoExtractAllChallenges = () => publish(readLoadedLessons());

    window.pycoExtractLessonChallenges = lessonNumber => {
        const key = challengeKeyForLesson(lessonNumber);
        const challenges = globalThis[key];

        if (challenges === undefined) {
            throw new Error(`${PREFIX} ${key} is not loaded on this page`);
        }

        return JSON.stringify(challenges, null, 2);
    };

    async function main() {
        const lessons = await waitUntilLessonGlobalsStable();
        publish(lessons);
    }

    main().catch(error => {
        console.error(`${PREFIX} error:`, error);
    });
})();
