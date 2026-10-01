// ==UserScript==
// @name         PyCo Challenge Extractor
// @namespace    https://github.com/eitaar/pyco-tools
// @updateURL    https://raw.githubusercontent.com/eitaar/pyco-tools/main/userscripts/pyco-extract.user.js
// @downloadURL  https://raw.githubusercontent.com/eitaar/pyco-tools/main/userscripts/pyco-extract.user.js
// @version      3.0.0
// @description  Fetches all Python Coach challenge files and combines them into one JSON object.
// @match        https://pythoncoach.org/*
// @match        https://www.pythoncoach.org/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==

(() => {
    "use strict";

    const PREFIX = "[PyCo Extractor]";
    const MAX_LESSON = 99;

    let lastJSON = null;

    function lessonInfo(lessonNumber) {
        const nn = String(lessonNumber).padStart(2, "0");

        return {
            nn,
            variable: `lesson${nn}Challenges`,
            url: new URL(
                `/js/challenges/lesson-${nn}-challenges.js`,
                location.origin,
            ).href,
        };
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = url;
            script.async = false;

            script.addEventListener("load", () => {
                script.remove();
                resolve();
            }, { once: true });

            script.addEventListener("error", () => {
                script.remove();
                reject(new Error(`failed to load ${url}`));
            }, { once: true });

            (document.head || document.documentElement).appendChild(script);
        });
    }

    async function loadLesson(lessonNumber) {
        const { nn, variable, url } = lessonInfo(lessonNumber);

        if (unsafeWindow[variable] === undefined) {
            await loadScript(url);
        }

        const challenges = unsafeWindow[variable];

        if (
            challenges === undefined ||
            challenges === null ||
            typeof challenges !== "object" ||
            Array.isArray(challenges)
        ) {
            throw new Error(
                `${variable} was not exposed as a challenge object after loading ${url}`,
            );
        }

        console.log(
            `${PREFIX} lesson ${nn} (${variable}): ${Object.keys(challenges).length} challenge(s)`,
        );

        return {
            lessonNumber,
            variable,
            challenges,
        };
    }

    function sortByNumericKey(object) {
        return Object.fromEntries(
            Object.entries(object).sort(([a], [b]) =>
                a.localeCompare(b, undefined, { numeric: true }),
            ),
        );
    }

    async function fetchAllChallenges() {
        console.log(`${PREFIX} fetching lessons 01-${MAX_LESSON}...`);

        const lessons = {};
        const allChallenges = {};
        const errors = [];

        for (let lessonNumber = 1; lessonNumber <= MAX_LESSON; lessonNumber += 1) {
            try {
                const result = await loadLesson(lessonNumber);

                lessons[result.variable] = result.challenges;

                for (const [id, challenge] of Object.entries(result.challenges)) {
                    if (Object.hasOwn(allChallenges, id)) {
                        console.warn(
                            `${PREFIX} duplicate challenge ID ${id}; overwriting previous value`,
                        );
                    }

                    allChallenges[id] = challenge;
                }
            } catch (error) {
                errors.push({
                    lesson: lessonNumber,
                    error: String(error),
                });

                console.error(
                    `${PREFIX} lesson ${String(lessonNumber).padStart(2, "0")} failed:`,
                    error,
                );
            }
        }

        const sortedLessons = Object.fromEntries(
            Object.entries(lessons).sort(([a], [b]) =>
                a.localeCompare(b, undefined, { numeric: true }),
            ),
        );
        const sortedChallenges = sortByNumericKey(allChallenges);
        const json = JSON.stringify(sortedChallenges, null, 2);

        lastJSON = json;

        console.log(
            `${PREFIX} done: ${Object.keys(sortedChallenges).length} challenge IDs from ${Object.keys(sortedLessons).length} lessons`,
        );

        if (errors.length > 0) {
            console.warn(`${PREFIX} ${errors.length} lesson(s) failed:`, errors);
        }

        console.log(`${PREFIX} combined JSON:\n${json}`);

        GM_setClipboard(json, "text");
        console.log(`${PREFIX} combined JSON copied to clipboard`);

        return {
            lessons: sortedLessons,
            challenges: sortedChallenges,
            json,
            errors,
        };
    }

    GM_registerMenuCommand("Fetch all challenges", () => {
        fetchAllChallenges().catch(error => {
            console.error(`${PREFIX} fatal error:`, error);
        });
    });

    GM_registerMenuCommand("Copy last JSON", () => {
        if (lastJSON === null) {
            console.warn(`${PREFIX} no JSON collected yet`);
            return;
        }

        GM_setClipboard(lastJSON, "text");
        console.log(`${PREFIX} combined JSON copied to clipboard`);
    });

    console.log(
        `${PREFIX} ready. Open the Tampermonkey menu and choose "Fetch all challenges".`,
    );
})();
