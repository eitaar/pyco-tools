// ==UserScript==
// @name         PyCo Challenge Extractor
// @namespace    https://github.com/eitaar/pyco-tools
// @version      2.0.0
// @description  Fetches all Python Coach challenge files and combines them into one JSON object.
// @match        https://pythoncoach.org/*
// @match        https://www.pythoncoach.org/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @license      MIT
// ==/UserScript==

(() => {
    "use strict";

    const PREFIX = "[PyCo Extractor]";
    const MAX_LESSON = 99;
    const CONCURRENCY = 6;

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

    function parseLessonSource(source, variable) {
        const match = source.match(
            new RegExp(
                `^\\s*var\\s+${variable}\\s*=\\s*([\\s\\S]*?)\\s*;?\\s*$`,
            ),
        );

        if (!match) {
            throw new Error(`could not find var ${variable} = ...`);
        }

        return JSON.parse(match[1]);
    }

    async function fetchLesson(lessonNumber) {
        const { nn, variable, url } = lessonInfo(lessonNumber);
        const response = await fetch(url, {
            credentials: "same-origin",
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`lesson ${nn}: HTTP ${response.status}`);
        }

        const source = await response.text();
        const challenges = parseLessonSource(source, variable);

        console.log(
            `${PREFIX} lesson ${nn}: ${Object.keys(challenges).length} challenge(s)`,
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

        const queue = Array.from(
            { length: MAX_LESSON },
            (_, index) => index + 1,
        );

        const lessons = {};
        const allChallenges = {};
        const errors = [];
        let cursor = 0;

        async function worker() {
            while (cursor < queue.length) {
                const index = cursor;
                cursor += 1;

                const lessonNumber = queue[index];

                try {
                    const result = await fetchLesson(lessonNumber);

                    if (!result) {
                        continue;
                    }

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
        }

        await Promise.all(
            Array.from(
                { length: CONCURRENCY },
                () => worker(),
            ),
        );

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
