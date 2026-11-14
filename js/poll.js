(() => {
    "use strict";

    const SURVEY_ID = "student_context_awareness_2026";
    const RESULTS_KEY = `${SURVEY_ID}_responses`;
    const LANGUAGE_KEY = `${SURVEY_ID}_language`;
    const SUBMIT_URL = "https://vercel-functions-azure.vercel.app/api/bellschedule/submit";
    const SUBMIT_TIMEOUT_MS = 15000;

    const localeList = window.pollLocales || {};
    const defaultLocale = localeList.ru ? "ru" : Object.keys(localeList)[0];
    if (!defaultLocale) {
        console.error("Survey locales are not loaded.");
        return;
    }
    const localeCodes = Object.keys(localeList);

    /* ------------------------------------------------------------------ */
    /* Language detection                                                  */
    /* ------------------------------------------------------------------ */

    const supportedLanguage = (value) => {
        if (typeof value !== "string") return null;
        const tag = value.trim().toLowerCase().replace(/_/g, "-");
        if (!tag) return null;
        const primary = tag.split("-")[0];
        return localeCodes.find((code) => code.toLowerCase() === tag)
            || localeCodes.find((code) => code.toLowerCase().split("-")[0] === primary)
            || null;
    };

    let languageStorageFailed = false;

    const detectLanguage = () => {
        try {
            const saved = supportedLanguage(localStorage.getItem(LANGUAGE_KEY));
            if (saved) return saved;
        } catch (error) {
            languageStorageFailed = true;
            console.error("Could not read the saved survey language.", error);
        }
        const browserLanguages = (Array.isArray(navigator.languages) && navigator.languages.length
            ? navigator.languages
            : [navigator.language]).filter(Boolean);
        for (const tag of browserLanguages) {
            const match = supportedLanguage(tag);
            if (match) return match;
        }
        return localeCodes.includes("en") ? "en" : defaultLocale;
    };

    let language = detectLanguage();
    let languageSaveFailed = languageStorageFailed;

    /* ------------------------------------------------------------------ */
    /* State                                                               */
    /* ------------------------------------------------------------------ */

    let stepIndex = 0;
    let completedRecord = null;
    let saveFailed = false;   // local storage only
    let sendState = "idle";   // idle | sending | sent | failed
    let endMode = null;       // null | "declined" | "complete"
    let localStatusBanner = null;
    let sendStatusBanner = null;
    let retrySendBtn = null;

    const state = {
        answers: {},
        startedAt: null,
        surveyVersion: null,
        educationCategory: null,
    };

    const root = document.querySelector("#poll .pageContent");
    if (!root) {
        console.error("Survey page container #poll .pageContent was not found.");
        return;
    }

    const t = (key) => {
        if (!localeList[language]?.ready) return localeList[defaultLocale].strings[key] || key;
        return localeList[language].strings[key] || localeList[defaultLocale].strings[key] || key;
    };

    const updatePageTitle = () => {
        document.title = t("title");
        document.documentElement.lang = localeList[language]?.ready ? language : defaultLocale;
        const bottomNavTitle = document.querySelector("#poll-navd span");
        const sideNavTitle = document.querySelector("#poll-navc span");
        if (bottomNavTitle) bottomNavTitle.textContent = t("navTitle");
        if (sideNavTitle) sideNavTitle.textContent = t("navTitle");
    };

    const keyOptions = (...keys) => keys;
    const question = (id, label, type, options = [], extra = {}) => ({ id, label, type, options, ...extra });

    const sections = {
        profile: {
            title: "sectionProfile",
            questions: [
                question("P1", "countryQuestion", "text", [], { required: true, placeholder: "countryPlaceholder", hint: "countryHint", maxLength: 100 }),
                question("P2", "educationQuestion", "radio", keyOptions("school", "college", "university", "other"), { required: true }),
                question("P3", "yearQuestion", "radio", [], { required: true }),
                question("P4", "ageQuestion", "radio", keyOptions("ageUnder14", "age14_15", "age16_17", "age18_20", "age21_24", "age25Plus", "preferNot")),
                question("P5", "languagesQuestion", "checkbox", keyOptions("russian", "ukrainian", "english", "romanian", "anotherLanguage", "preferNot")),
            ],
        },
        needs: {
            title: "sectionNeeds",
            questions: [
                question("N1", "needSchoolQuestion", "checkbox", [], { required: true, otherValue: "otherInformation" }),
                question("N2", "importantQuestion", "checkbox", [], { max: 3 }),
                question("N3", "searchFrequencyQuestion", "radio", keyOptions("severalDaily", "onceDaily", "severalWeekly", "onceWeekly", "lessWeekly", "almostNever"), { required: true }),
                question("N4", "hardToFindQuestion", "radio", keyOptions("never", "rarely", "sometimes", "often", "veryOften")),
            ],
        },
        context: {
            title: "sectionContext",
            questions: [
                question("C1", "momentsQuestion", "checkbox", keyOptions("beforeLeaving", "onTheWay", "beforeSchoolDay", "beforeClass", "duringClass", "duringBreak", "afterClasses", "whileStudying", "beforeExams", "weekends", "anyTime"), { required: true }),
                question("C2", "urgentQuestion", "checkbox", keyOptions("scheduleChanged", "classCanceled", "roomChanged", "newAssignment", "deadlineChanged", "examComing", "materialsPublished", "importantAnnouncement", "newEvent", "otherUrgent", "rarelyUrgent"), { required: true }),
                question("C3", "timelyImportanceQuestion", "scale", [], { required: true, labels: ["notImportant", "ratherUnimportant", "moderatelyImportant", "important", "extremelyImportant"] }),
                question("C4", "contextDependenceQuestion", "scale", [], { labels: ["notDependent", "weaklyDependent", "somewhatDependent", "stronglyDependent", "fullyDependent"] }),
                question("C5", "timeInfluenceQuestion", "radio", keyOptions("yesSignificantly", "yesSomewhat", "noInfluence", "unsure")),
            ],
        },
        sources: {
            title: "sectionSources",
            questions: [
                question("S1", "sourcesQuestion", "checkbox", keyOptions("officialWebsite", "electronicJournal", "learningPlatform", "messengers", "socialNetworks", "email", "teachers", "classmates", "family", "noticeBoards", "other"), { required: true, otherValue: "other" }),
                question("S2", "sourcesCountQuestion", "radio", keyOptions("oneSource", "twoSources", "threeSources", "fourSources", "cannotDetermine")),
                question("S3", "problemsQuestion", "checkbox", keyOptions("informationScattered", "tooManyMessages", "messageMissed", "lateInformation", "outdatedInformation", "unclearReliability", "noNotifications", "platformDifficult", "checkManySources", "noProblems", "otherProblem"), { required: true, otherValue: "otherProblem", exclusive: ["noProblems"] }),
                question("S4", "satisfactionQuestion", "scale", [], { labels: ["fullyDissatisfied", "ratherDissatisfied", "neutral", "ratherSatisfied", "fullySatisfied"] }),
            ],
        },
        app: {
            title: "sectionApp",
            questions: [
                question("A1", "appUsefulnessQuestion", "scale", [], { required: true, labels: ["useless", "ratherUseless", "possiblyUseful", "useful", "veryUseful"] }),
                question("A2", "appContextQuestion", "checkbox", keyOptions("date", "timeOfDay", "weekday", "classOrGroup", "mySchedule", "currentClass", "assignmentDeadlines", "interests", "preferences", "location", "otherFactor", "noContextNeeded"), { exclusive: ["noContextNeeded"], otherValue: "otherFactor" }),
                question("A3", "appFeaturesQuestion", "checkbox", keyOptions("featureSchedule", "featureChanges", "featureTasks", "featureExams", "featureAnnouncements", "featureMaterials", "featureSearch", "featureEvents", "featureRecommendations", "featureFilters", "featureSettings", "otherFunction"), { required: true, max: 5, otherValue: "otherFunction" }),
                question("A4", "notificationsQuestion", "radio", keyOptions("allNotifications", "urgentNotifications", "chooseNotifications", "openToCheck", "noNotificationsWanted")),
                question("A5", "dataQuestion", "checkbox", keyOptions("location", "scheduleData", "academicData", "interestsData", "contactData", "dataNoObjection", "otherData"), { exclusive: ["dataNoObjection"], otherValue: "otherData" }),
            ],
        },
        open: {
            title: "sectionOpen",
            questions: [
                question("O1", "openQuestion", "textarea", [], { placeholder: "openPlaceholder", hint: "personalDataReminder", maxLength: 2000 }),
            ],
        },
    };

    const shortQuestionIds = new Set(["P1", "P2", "P3", "N1", "N3", "C1", "C2", "C3", "S1", "S3", "A1", "A3"]);

    const schoolNeedKeys = [
        "needSchoolSchedule", "needScheduleChanges", "needSchoolHomework", "needSchoolDeadlines",
        "needSchoolExams", "needSchoolMaterials", "needSchoolGrades", "needSchoolAnnouncements",
        "needSchoolActivities", "needSchoolClubs", "needSchoolEvents", "needSchoolCareer", "otherInformation",
    ];
    const studentNeedKeys = [
        "needStudentSchedule", "needScheduleChanges", "needStudentWork", "needStudentDeadlines",
        "needStudentExams", "needStudentClasses", "needStudentGrades", "needStudentAnnouncements",
        "needStudentScholarships", "needStudentInternships", "needStudentEvents", "needStudentExchange",
        "needStudentJobs", "otherInformation",
    ];
    const otherNeedKeys = [
        "needOtherSchedule", "needScheduleChanges", "needOtherTasks", "needOtherExams",
        "needOtherProgress", "needOtherAnnouncements", "needOtherActivities", "needOtherOpportunities",
        "otherInformation",
    ];

    const currentSteps = () => {
        const steps = ["intro", "version", "profile", "needs", "context", "sources", "app"];
        if (state.surveyVersion === "full") steps.push("open");
        steps.push("review");
        return steps;
    };

    const activeQuestions = (sectionId) => {
        const section = sections[sectionId];
        if (!section) return [];
        return section.questions.filter((item) => {
            if (state.surveyVersion === "short" && !shortQuestionIds.has(item.id)) return false;
            if (item.id === "P3" && !state.educationCategory) return false;
            if (item.id === "P3" && state.educationCategory === "other") return true;
            if (item.id === "P4" || item.id === "P5") return state.surveyVersion === "full";
            if (item.id === "N2" && state.educationCategory === "other") return state.surveyVersion === "full";
            return true;
        }).map((item) => {
            if (item.id === "N1") {
                const options = state.educationCategory === "school" ? schoolNeedKeys
                    : state.educationCategory === "other" ? otherNeedKeys : studentNeedKeys;
                return {
                    ...item,
                    label: state.educationCategory === "school" ? "needSchoolQuestion"
                        : state.educationCategory === "other" ? "needOtherQuestion" : "needStudentQuestion",
                    options,
                };
            }
            if (item.id === "N2") {
                const options = state.educationCategory === "school" ? schoolNeedKeys
                    : state.educationCategory === "other" ? otherNeedKeys : studentNeedKeys;
                return { ...item, options };
            }
            if (item.id === "P3") {
                if (state.educationCategory === "other") {
                    return { ...item, type: "text", required: false, options: [], placeholder: "otherYearPlaceholder", maxLength: 100 };
                }
                const options = state.educationCategory === "school"
                    ? ["schoolYear8", "schoolYear9", "schoolYear10", "schoolYear11", "schoolYear12", "anotherYear"]
                    : ["studentYear1", "studentYear2", "studentYear3", "studentYear4", "studentYear5", "anotherYear"];
                return { ...item, options };
            }
            return item;
        });
    };

    /* ------------------------------------------------------------------ */
    /* DOM helpers                                                         */
    /* ------------------------------------------------------------------ */

    const fixedBtns = document.createElement("div");
    fixedBtns.id = "fixedBtns";
    const contentElement = document.getElementById("content");
    if (contentElement) contentElement.appendChild(fixedBtns);

    const h = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };

    const setText = (element, text) => {
        if (element) element.textContent = text;
    };

    const makeBanner = (message, className = "survey-banner") => {
        const banner = h("p", className, message);
        banner.setAttribute("role", "status");
        return banner;
    };

    const focusOption = (questionId, value) => {
        const inputs = root.querySelectorAll(`input[data-question-id="${questionId}"]`);
        for (const input of inputs) {
            if (input.value === value) {
                input.focus({ preventScroll: true });
                return;
            }
        }
    };

    /* ------------------------------------------------------------------ */
    /* Language picker                                                     */
    /* ------------------------------------------------------------------ */

    const selectLanguage = (code) => {
        if (!localeList[code] || code === language) return;
        language = code;
        languageSaveFailed = false;
        try {
            localStorage.setItem(LANGUAGE_KEY, language);
        } catch (error) {
            languageSaveFailed = true;
            console.error("Could not save the selected survey language.", error);
        }
        const scrollY = window.scrollY;
        if (endMode === "complete") renderComplete();
        else if (endMode === "declined") renderDeclined();
        else render();
        window.requestAnimationFrame(() => window.scrollTo({ top: scrollY }));
    };

    const addLanguagePicker = (container) => {
        const label = h("div", "survey-language-label", t("languageLabel"));
        label.id = "survey-language-label";
        const group = h("div", "btnsList");
        group.id = "survey-language";
        group.setAttribute("role", "group");
        group.setAttribute("aria-labelledby", label.id);
        localeCodes.forEach((code) => {
            const locale = localeList[code] || {};
            const btn = document.createElement("button");
            btn.type = "button";
            btn.dataset.where = `langBtn_${code}`;
            btn.dataset.lang = code;
            btn.setAttribute("aria-pressed", String(code === language));
            if (code === language) btn.classList.add("active");
            const icon = h("div", "imgcont");
            const img = document.createElement("img");
            img.src = "img/ui/check/checked.svg";
            img.alt = "";
            icon.appendChild(img);
            const caption = `${locale.name || code}${locale.ready ? "" : ` ${t("translationPendingLabel")}`}`;
            btn.append(icon, h("p", "", caption));
            btn.addEventListener("click", () => selectLanguage(code));
            group.appendChild(btn);
        });
        container.append(label, group);
    };

    /* ------------------------------------------------------------------ */
    /* Header and progress                                                 */
    /* ------------------------------------------------------------------ */

    const stepTitle = (stepId) => {
        if (stepId === "intro") return t("introTitle");
        if (stepId === "version") return t("versionTitle");
        if (stepId === "review") return t("sectionReview");
        return t(sections[stepId]?.title || "");
    };

    const renderHeader = (steps, currentStep, currentStepId) => {
        updatePageTitle();
        window.requestAnimationFrame(updatePageTitle);
        const header = h("header", "survey-header");
        const title = h("div", "survey-header-title");
        const languagePicker = h("div", "survey-language-picker");
        addLanguagePicker(languagePicker);
        header.append(title, languagePicker);
        root.appendChild(header);

        const activeLocale = localeList[language];
        if (activeLocale && !activeLocale.ready && activeLocale.notice) {
            root.appendChild(makeBanner(activeLocale.notice, "survey-banner survey-language-notice"));
        }
        if (languageSaveFailed) root.appendChild(makeBanner(t("languageSaveError"), "survey-banner survey-error"));

        if (currentStep !== null && currentStep >= 2) {
            const stepsCount = Math.max(1, steps.length - 2); // profile … review
            const blockNumber = Math.min(stepsCount, currentStep - 1);
            const progressValue = Math.max(0, Math.min(100, Math.round((blockNumber / stepsCount) * 100)));
            const progress = h("div", "survey-progress");
            const progressLabel = h("div", "survey-progress-label");
            progressLabel.append(
                h("span", "", `${t("progress")}: ${progressValue}%`),
                h("span", "", `${t("block")} ${blockNumber} ${t("of")} ${stepsCount} — ${stepTitle(currentStepId)}`)
            );
            const progressBar = document.createElement("progress");
            progressBar.max = 100;
            progressBar.value = progressValue;
            progressBar.setAttribute("aria-label", t("progress"));
            progress.append(progressLabel, progressBar);
            root.appendChild(progress);
        }
    };

    /* ------------------------------------------------------------------ */
    /* Question rendering                                                  */
    /* ------------------------------------------------------------------ */

    const addFieldHint = (container, item) => {
        if (item.hint) container.appendChild(h("small", "survey-hint", t(item.hint)));
    };

    const makeSettingCard = (container, { id, type, title, description = false, settings = {}, value, index = 0, ariaLabel }) => {
        if (typeof window.settingCard !== "function") {
            throw new Error("The settingCard component is not available");
        }
        const cardId = `survey-${id}-${index}`;
        const card = new window.settingCard(cardId, type, title, description, {
            ...settings,
            default: value,
            noShowValue: true,
            reversed: type !== "text" && type !== "textarea",
            splited: type === "text" || type === "textarea" ? true : settings.splited,
        });
        const input = card.el.querySelector("input, textarea");
        if (!input) throw new Error(`The settingCard component did not create an input for ${id}`);
        input.id = `${cardId}-input`;
        input.dataset.questionId = id;
        input.setAttribute("aria-label", ariaLabel || title || id);
        card.el.classList.add("survey-setting-option");
        container.appendChild(card.el);
        return input;
    };

    const makeSettingGroup = () => window.settingsCardsMgr.createGroup("", false, false, {
        class: "dense survey-setting-group",
    });

    const addTextInput = (container, item) => {
        const input = makeSettingCard(container, {
            id: item.id,
            type: item.type,
            title: false,
            ariaLabel: t(item.label),
            value: state.answers[item.id] || "",
            settings: {
                placeholder: t(item.placeholder || ""),
                maxLength: item.maxLength || 1000,
                rows: 5,
            },
        });
        input.name = item.id;
        input.autocomplete = "off";
    };

    const addChoice = (container, item, value, index, inputType, selectedValues, title = t(value)) => {
        const selected = inputType === "checkbox"
            ? selectedValues.includes(value)
            : selectedValues[0] === value;
        const input = makeSettingCard(container, {
            id: item.id,
            type: inputType,
            title,
            index,
            value: selected,
            settings: { name: item.id, grouped: inputType === "checkbox" },
        });
        input.name = item.id;
        input.value = value;
        input.dataset.exclusive = (item.exclusive || []).includes(value) ? "true" : "false";
        if (item.max && inputType === "checkbox" && !selected && selectedValues.length >= item.max) input.disabled = true;
    };

    const addQuestion = (container, item, errors) => {
        const fieldset = h("fieldset", "survey-question");
        fieldset.dataset.questionId = item.id;
        const legend = h("legend", "", t(item.label));
        if (item.required) {
            const required = h("span", "survey-required", " *");
            required.setAttribute("aria-label", t("requiredLabel"));
            legend.appendChild(required);
        }
        fieldset.appendChild(legend);
        if (errors.has(item.id)) {
            const error = makeBanner(t("requiredError"), "survey-field-error");
            error.id = `survey-error-${item.id}`;
            fieldset.appendChild(error);
            fieldset.setAttribute("aria-describedby", error.id);
        }
        if (item.type === "text" || item.type === "textarea") {
            addTextInput(fieldset, item);
        } else if (item.type === "scale") {
            const scale = makeSettingGroup();
            item.labels.forEach((labelKey, index) => {
                addChoice(scale, item, String(index + 1), index + 1, "radio", [String(state.answers[item.id] || "")], `${index + 1} — ${t(labelKey)}`);
            });
            fieldset.appendChild(scale);
        } else {
            const inputType = item.type === "checkbox" ? "checkbox" : "radio";
            const choices = makeSettingGroup();
            const stored = state.answers[item.id];
            const selectedValues = Array.isArray(stored) ? stored : (stored ? [stored] : []);
            item.options.forEach((option, index) => addChoice(choices, item, option, index, inputType, selectedValues));
            fieldset.appendChild(choices);
            if (item.otherValue && selectedValues.includes(item.otherValue)) {
                const detail = h("div", "survey-other-detail");
                makeSettingCard(detail, {
                    id: `${item.id}_other`,
                    type: "text",
                    title: t("otherSpecify"),
                    value: state.answers[`${item.id}_other`] || "",
                    settings: { placeholder: t("otherSpecify"), maxLength: 500 },
                });
                fieldset.appendChild(detail);
            }
        }
        addFieldHint(fieldset, item);
        container.appendChild(fieldset);
    };

    const updateFixedBtnsState = (stepId) => {
        if (!fixedBtns) return;
        let requiredQuestions = [];
        if (stepId === "intro") {
            requiredQuestions = [question("C0", "", "radio", [], { required: true })];
        } else if (stepId === "version") {
            requiredQuestions = [question("V1", "", "radio", [], { required: true })];
        } else if (sections[stepId]) {
            requiredQuestions = activeQuestions(stepId).filter((item) => item.required);
            if (stepId === "profile" && state.educationCategory && state.educationCategory !== "other") {
                requiredQuestions.push(question("P3", "", "radio", [], { required: true }));
            }
        }
        const allAnswered = requiredQuestions.every((item) => isAnswered(item));
        fixedBtns.classList.toggle("active", allAnswered);
    };

    /* ------------------------------------------------------------------ */
    /* Steps                                                               */
    /* ------------------------------------------------------------------ */

    const renderIntro = (container, errors) => {
        container.append(
            h("h2", "", t("introTitle")),
            h("p", "", t("introduction")),
            h("p", "", t("introductionNeeds")),
            h("p", "", t("audience")),
            h("p", "", t("duration"))
        );
        const privacy = h("div", "survey-info-card");
        privacy.append(h("p", "", t("privacy")), h("p", "", t("minors")), h("p", "", t("storageNotice")));
        container.appendChild(privacy);
        const item = question("C0", "consentTitle", "radio", keyOptions("consentYes", "consentNo"), { required: true });
        addQuestion(container, item, errors);
    };

    const renderVersion = (container, errors) => {
        const fieldset = h("fieldset", "survey-question survey-version-options");
        fieldset.dataset.questionId = "V1";
        fieldset.appendChild(h("legend", "", t("versionTitle")));
        if (errors.has("V1")) {
            const error = makeBanner(t("requiredError"), "survey-field-error");
            error.id = "survey-error-V1";
            fieldset.appendChild(error);
        }
        const choices = makeSettingGroup();
        [
            { value: "full", title: "versionFull", description: "versionFullDescription" },
            { value: "short", title: "versionShort", description: "versionShortDescription" },
        ].forEach((version, index) => {
            const input = makeSettingCard(choices, {
                id: "V1",
                type: "radio",
                title: t(version.title),
                description: t(version.description),
                index,
                value: state.surveyVersion === version.value,
                settings: { name: "V1" },
            });
            input.name = "V1";
            input.value = version.value;
        });
        fieldset.appendChild(choices);
        container.appendChild(fieldset);
    };

    const renderReview = (container) => {
        container.appendChild(h("h2", "", t("sectionReview")));
        container.appendChild(h("p", "", t("reviewText")));
        const summary = h("dl", "survey-review");
        [
            [t("reviewVersion"), state.surveyVersion === "full" ? t("versionFull") : t("versionShort")],
            [t("reviewLanguage"), (localeList[language] && localeList[language].name) || language],
        ].forEach(([label, value]) => {
            summary.append(h("dt", "", label), h("dd", "", value));
        });
        container.append(summary, makeBanner(t("storageNotice")));
    };

    const clearErrors = () => root.querySelectorAll(".survey-field-error").forEach((element) => element.remove());

    const render = (errors = new Set()) => {
        endMode = null;
        root.replaceChildren();
        const steps = currentSteps();
        const stepId = steps[stepIndex] || "intro";
        renderHeader(steps, stepIndex, stepId);

        const panel = h("section", "survey-panel");
        const form = document.createElement("form");
        form.noValidate = true;

        if (stepId === "intro") {
            renderIntro(form, errors);
        } else if (stepId === "version") {
            renderVersion(form, errors);
        } else if (stepId === "review") {
            renderReview(form);
        } else {
            setText(document.querySelector("#poll .page-header-title"), t(sections[stepId].title));
            setText(document.querySelector("#poll h3"), "");
            if (stepId === "app") {
                const concept = h("div", "survey-info-card");
                concept.append(h("h3", "", t("conceptTitle")), h("p", "", t("conceptText")));
                form.appendChild(concept);
            }
            activeQuestions(stepId).forEach((item) => addQuestion(form, item, errors));
        }

        fixedBtns.replaceChildren();
        if (stepIndex > 0) {
            const back = h("button", "aBtn sec", t("back"));
            back.type = "button";
            back.addEventListener("click", () => {
                stepIndex = Math.max(0, stepIndex - 1);
                render();
                root.scrollIntoView({ block: "start", behavior: "smooth" });
            });
            fixedBtns.appendChild(back);
        }

        const nextLabel = stepId === "review" ? t("completeButton")
            : stepIndex === steps.length - 2 ? t("finish") : t("next");
        const next = h("button", "aBtn", nextLabel);
        next.type = "button";
        next.addEventListener("click", () => {
            form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
        fixedBtns.appendChild(next);

        const useSubmit = () => {
            if (!validate(stepId)) return;
            if (stepId === "intro" && state.answers.C0 === "consentNo") {
                renderDeclined();
                return;
            }
            if (stepId === "review") {
                completeSurvey();
                return;
            }
            if (stepId === "version") state.surveyVersion = state.answers.V1;
            stepIndex = Math.min(stepIndex + 1, currentSteps().length - 1);
            render();
            root.scrollIntoView({ block: "start", behavior: "smooth" });
        };

        form.addEventListener("change", (event) => handleChange(event, stepId));
        form.addEventListener("input", (event) => handleInput(event));
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            useSubmit();
        });

        panel.appendChild(form);
        root.appendChild(panel);
        updateFixedBtnsState(stepId);
    };

    /* ------------------------------------------------------------------ */
    /* Answer handling                                                     */
    /* ------------------------------------------------------------------ */

    const handleInput = (event) => {
        const input = event.target;
        const id = input.dataset.questionId;
        if (!id || input.type === "checkbox" || input.type === "radio") return;
        state.answers[id] = input.value;
        updateFixedBtnsState(currentSteps()[stepIndex]);
    };

    const handleChange = (event, stepId) => {
        const input = event.target;
        const id = input.dataset.questionId;
        if (!id) return;

        if (id === "P2") {
            const newCategory = input.value;
            if (newCategory !== state.educationCategory) {
                state.educationCategory = newCategory;
                delete state.answers.P3;
                delete state.answers.N1;
                delete state.answers.N1_other;
                delete state.answers.N2;
                delete state.answers.N2_other;
            }
            state.answers.P2 = newCategory;
            render();
            focusOption("P2", newCategory);
            updateFixedBtnsState(stepId);
            return;
        }

        if (id === "V1") {
            const previousVersion = state.surveyVersion;
            state.answers.V1 = input.value;
            if (previousVersion && previousVersion !== input.value) {
                state.answers = { C0: state.answers.C0, V1: input.value };
                state.educationCategory = null;
            }
            state.surveyVersion = input.value;
            updateFixedBtnsState(stepId);
            return;
        }

        if (id.endsWith("_other")) {
            state.answers[id] = input.value;
            updateFixedBtnsState(stepId);
            return;
        }

        if (input.type === "checkbox") {
            const item = activeQuestions(stepId).find((candidate) => candidate.id === id);
            const selected = Array.isArray(state.answers[id]) ? [...state.answers[id]] : [];
            const exclusive = item?.exclusive || [];
            if (input.checked) {
                if (exclusive.includes(input.value)) {
                    selected.splice(0, selected.length, input.value);
                } else {
                    const remaining = selected.filter((value) => !exclusive.includes(value));
                    if (item?.max && remaining.length >= item.max) {
                        input.checked = false;
                        updateFixedBtnsState(stepId);
                        return;
                    }
                    remaining.push(input.value);
                    selected.splice(0, selected.length, ...remaining);
                }
            } else {
                const index = selected.indexOf(input.value);
                if (index >= 0) selected.splice(index, 1);
            }
            state.answers[id] = selected;
            render();
            focusOption(id, input.value);
            return;
        }

        if (input.type === "radio") {
            state.answers[id] = input.value;
            updateFixedBtnsState(stepId);
        }
    };

    const isAnswered = (item) => {
        const value = state.answers[item.id];
        if (item.type === "text") return typeof value === "string" && value.trim().length > 0;
        if (item.type === "textarea") return true;
        if (item.type === "checkbox") return Array.isArray(value) && value.length > 0;
        return value !== undefined && value !== "";
    };

    const validate = (stepId) => {
        clearErrors();
        const errors = new Set();
        let requiredQuestions = [];
        if (stepId === "intro") {
            requiredQuestions = [question("C0", "", "radio", [], { required: true })];
        } else if (stepId === "version") {
            requiredQuestions = [question("V1", "", "radio", [], { required: true })];
        } else if (sections[stepId]) {
            requiredQuestions = activeQuestions(stepId).filter((item) => item.required);
            if (stepId === "profile" && state.educationCategory && state.educationCategory !== "other") {
                requiredQuestions.push(question("P3", "", "radio", [], { required: true }));
            }
        }
        requiredQuestions.forEach((item) => {
            if (!isAnswered(item)) errors.add(item.id);
        });
        activeQuestions(stepId).forEach((item) => {
            const value = state.answers[item.id];
            if (item.max && Array.isArray(value) && value.length > item.max) errors.add(item.id);
        });
        if (errors.size) {
            render(errors);
            const firstError = root.querySelector(".survey-field-error");
            firstError?.scrollIntoView({ block: "center", behavior: "smooth" });
            firstError?.closest("fieldset")?.querySelector("input, textarea")?.focus();
            return false;
        }
        return true;
    };

    /* ------------------------------------------------------------------ */
    /* Record building (option keys, not translations)                     */
    /* ------------------------------------------------------------------ */

    const recordAnswers = () => {
        const allowed = new Set(["C0", "V1"]);
        Object.keys(sections).forEach((sectionId) => {
            activeQuestions(sectionId).forEach((item) => allowed.add(item.id));
        });
        const answers = {};
        for (const [id, rawValue] of Object.entries(state.answers)) {
            if (id.endsWith("_other")) {
                const parentId = id.slice(0, -6);
                if (!allowed.has(parentId) || typeof rawValue !== "string") continue;
                const detail = rawValue.trim();
                if (detail) answers[id] = detail;
                continue;
            }
            if (!allowed.has(id)) continue;
            if (Array.isArray(rawValue)) {
                const keys = rawValue.filter((key) => typeof key === "string" && key);
                if (keys.length) answers[id] = keys;
            } else if (typeof rawValue === "string") {
                const value = rawValue.trim();
                if (value) answers[id] = value;
            }
        }
        const categoryLabels = { school: "school", college: "student", university: "student", other: "other" };
        const participant = {
            country: typeof state.answers.P1 === "string" ? state.answers.P1.trim() : null,
            education_type: categoryLabels[state.educationCategory] || null,
            education_category: state.educationCategory || null,
        };
        if (state.answers.P3) participant.education_year = String(state.answers.P3).trim();
        if (state.answers.P4) participant.age_group = state.answers.P4;
        if (Array.isArray(state.answers.P5) && state.answers.P5.length) {
            participant.information_languages = [...state.answers.P5];
        }
        return {
            survey_id: SURVEY_ID,
            survey_version: state.surveyVersion,
            language,
            started_at: state.startedAt,
            completed_at: new Date().toISOString(),
            participant,
            answers,
            metadata: {
                region_group: null,
                completed: true,
                answer_format: "option_keys",
            },
        };
    };

    const persistRecord = (record) => {
        let existing = [];
        const raw = localStorage.getItem(RESULTS_KEY);
        if (raw) {
            existing = JSON.parse(raw);
            if (!Array.isArray(existing)) throw new Error("Stored survey responses are not an array.");
        }
        existing.push(record);
        localStorage.setItem(RESULTS_KEY, JSON.stringify(existing));
    };

    /* ------------------------------------------------------------------ */
    /* Saving locally and sending to the server                            */
    /* ------------------------------------------------------------------ */

    const completeSurvey = async () => {
        completedRecord = recordAnswers();
        saveFailed = false;
        try {
            persistRecord(completedRecord);
        } catch (error) {
            saveFailed = true;
            console.error("Could not save survey responses locally.", error);
        }
        renderComplete();
        await sendRecord();
    };

    const sendRecord = async () => {
        if (!completedRecord || sendState === "sending") return;
        sendState = "sending";
        updateCompleteStatus();
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
        try {
            const response = await fetch(SUBMIT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(completedRecord),
                signal: controller.signal,
            });
            if (!response.ok) throw new Error(`Server responded with ${response.status}`);
            sendState = "sent";
        } catch (error) {
            sendState = "failed";
            console.error("Could not send survey responses to the server.", error);
        } finally {
            window.clearTimeout(timer);
        }
        updateCompleteStatus();
    };

    const updateCompleteStatus = () => {
        if (localStatusBanner) {
            localStatusBanner.textContent = saveFailed ? t("saveFailed") : t("savedLocally");
            localStatusBanner.className = saveFailed ? "survey-banner survey-error" : "survey-banner survey-success";
        }
        if (sendStatusBanner) {
            const states = {
                idle: [null, "survey-banner hidden"],
                sending: ["sendingNotice", "survey-banner"],
                sent: ["sentNotice", "survey-banner survey-success"],
                failed: ["sendFailed", "survey-banner survey-error"],
            };
            const [key, className] = states[sendState] || states.idle;
            sendStatusBanner.textContent = key ? t(key) : "";
            sendStatusBanner.className = className;
        }
        if (retrySendBtn) retrySendBtn.classList.toggle("hidden", sendState !== "failed");
    };

    /* ------------------------------------------------------------------ */
    /* Export                                                              */
    /* ------------------------------------------------------------------ */

    const downloadFile = (name, content, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const csvCell = (value) => {
        let text = typeof value === "string" ? value : JSON.stringify(value);
        if (text === undefined || text === null) text = "";
        if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
    };

    const exportJson = (panel) => {
        try {
            downloadFile(`${SURVEY_ID}.json`, JSON.stringify(completedRecord, null, 2), "application/json;charset=utf-8");
        } catch (error) {
            console.error("Could not export survey JSON.", error);
            panel.appendChild(makeBanner(t("csvError"), "survey-banner survey-error"));
        }
    };

    const exportCsv = (panel) => {
        try {
            const flat = { ...completedRecord };
            delete flat.participant;
            delete flat.answers;
            delete flat.metadata;
            Object.entries(completedRecord.participant || {}).forEach(([key, value]) => {
                flat[`participant_${key}`] = value;
            });
            Object.entries(completedRecord.metadata || {}).forEach(([key, value]) => {
                flat[`metadata_${key}`] = value;
            });
            Object.assign(flat, completedRecord.answers || {});
            const entries = Object.entries(flat);
            const contents = [
                entries.map(([key]) => csvCell(key)).join(","),
                entries.map(([, value]) => csvCell(value)).join(","),
            ].join("\r\n");
            downloadFile(`${SURVEY_ID}.csv`, "\uFEFF" + contents, "text/csv;charset=utf-8");
        } catch (error) {
            console.error("Could not export survey CSV.", error);
            panel.appendChild(makeBanner(t("csvError"), "survey-banner survey-error"));
        }
    };

    /* ------------------------------------------------------------------ */
    /* Final screens                                                       */
    /* ------------------------------------------------------------------ */

    const renderDeclined = () => {
        endMode = "declined";
        const page = document.getElementById("end");
        setText(page.querySelector("h1"), t("declinedTitle"));
        setText(page.querySelector("h3"), t("declinedText"));
        root.replaceChildren();
        fixedBtns.replaceChildren();
        const btn = h("button", "aBtn");
        btn.type = "button";
        btn.innerHTML = '<img src="img/ui/back.svg"><span></span>';
        btn.querySelector("span").textContent = t("return");
        btn.addEventListener("click", () => {
            endMode = null;
            changePage("poll");
            render();
        });
        fixedBtns.appendChild(btn);
        changePage("end");
        fixedBtns.classList.add("active");
    };

    const renderComplete = () => {
        endMode = "complete";
        const page = document.getElementById("end");
        setText(page.querySelector("h1"), t("completeTitle"));
        setText(page.querySelector("h3"), "");
        root.replaceChildren();
        renderHeader([], null, null);

        const panel = h("section", "survey-panel survey-complete");
        panel.appendChild(h("h2", "", t("completeTitle")));
        localStatusBanner = makeBanner("", "survey-banner");
        localStatusBanner.id = "survey-local-status";
        sendStatusBanner = makeBanner("", "survey-banner");
        sendStatusBanner.id = "survey-send-status";
        panel.append(localStatusBanner, sendStatusBanner);
        root.appendChild(panel);

        fixedBtns.replaceChildren();
        retrySendBtn = h("button", "aBtn sec hidden", t("retrySend"));
        retrySendBtn.type = "button";
        retrySendBtn.addEventListener("click", () => { sendRecord(); });

        const json = h("button", "aBtn sec", t("downloadJson"));
        json.type = "button";
        json.addEventListener("click", () => exportJson(panel));

        const csv = h("button", "aBtn sec", t("downloadCsv"));
        csv.type = "button";
        csv.addEventListener("click", () => exportCsv(panel));

        fixedBtns.append(retrySendBtn, json, csv);
        fixedBtns.classList.add("active");
        changePage("end");
        updateCompleteStatus();
    };

    /* ------------------------------------------------------------------ */
    /* Boot                                                                */
    /* ------------------------------------------------------------------ */

    root.addEventListener("submit", () => {
        if (!state.startedAt && state.answers.C0 === "consentYes") state.startedAt = new Date().toISOString();
    }, true);

    document.addEventListener("DOMContentLoaded", () => {
        render();
    }, { once: true });
})();