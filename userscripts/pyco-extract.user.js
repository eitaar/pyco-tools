// ==UserScript==
// @name         PyCo Challenge Extractor
// @namespace    https://github.com/eitaar/pyco-tools
// @updateURL    https://raw.githubusercontent.com/eitaar/pyco-tools/main/userscripts/pyco-extract.user.js
// @downloadURL  https://raw.githubusercontent.com/eitaar/pyco-tools/main/userscripts/pyco-extract.user.js
// @version      2.2.0
// @description  Fetches all Python Coach challenge files and combines them into one JSON object.
// @match        https://pythoncoach.org/*
// @match        https://www.pythoncoach.org/*
// @run-at       document-start
// @require      https://cdn.jsdelivr.net/npm/json5@2.2.3/dist/index.min.js
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

    function extractObjectLiteral(source, fromIndex) {
        const start = source.indexOf("{", fromIndex);

        if (start === -1) {
            throw new Error("could not find challenge object literal");
        }

        let depth = 0;
        let quote = null;
        let escaped = false;
        let lineComment = false;
        let blockComment = false;

        for (let i = start; i < source.length; i += 1) {
            const char = source[i];
            const next = source[i + 1];

            if (lineComment) {
                if (char === "\n") {
                    lineComment = false;
                }
                continue;
            }

            if (blockComment) {
                if (char === "*" && next === "/") {
                    blockComment = false;
                    i += 1;
                }
                continue;
            }

            if (quote !== null) {
                if (escaped) {
                    escaped = false;
                    continue;
                }

                if (char === "\\") {
                    escaped = true;
                    continue;
                }

                if (char === quote) {
                    quote = null;
                }

                continue;
            }

            if (char === "/" && next === "/") {
                lineComment = true;
                i += 1;
                continue;
            }

            if (char === "/" && next === "*") {
                blockComment = true;
                i += 1;
                continue;
            }

            if (char === "'" || char === "\"") {
                quote = char;
                continue;
            }

            if (char === "{") {
                depth += 1;
                continue;
            }

            if (char === "}") {
                depth -= 1;

                if (depth === 0) {
                    return source.slice(start, i + 1);
                }
            }
        }

        throw new Error("unterminated challenge object literal");
    }

    function parseLessonSource(source) {
        const declaration = source.match(
            /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=/,
        );

        if (!declaration) {
            throw new Error("could not find a challenge variable declaration");
        }

        const variable = declaration[1];
        const assignmentEnd = declaration.index + declaration[0].length;
        const objectLiteral = extractObjectLiteral(source, assignmentEnd);

        // The challenge files use JavaScript/JSON5-style object literals
        // (e.g. unquoted keys, single quotes, comments, trailing commas).
        // Parse the data without eval/Function so Python Coach's CSP is respected.
        const challenges = JSON5.parse(objectLiteral);

        if (
            challenges === null ||
            typeof challenges !== "object" ||
            Array.isArray(challenges)
        ) {
            throw new Error(`${variable} did not parse to an object`);
        }

        return { variable, challenges };
    }

    async function fetchLesson(lessonNumber) {
        const { nn, url } = lessonInfo(lessonNumber);
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
        const { variable, challenges } = parseLessonSource(source);

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
