const quizRepository = require('../repositories/quizRepository');
const progressRepository = require('../repositories/progressRepository');
const ApiError = require('../utils/apiError');

const getAllQuizzes = async () => {
    const quizzes = await quizRepository.findAll();

    const grouped = {};
    quizzes.forEach((quiz) => {
        if (!grouped[quiz.chapterTitle]) {
            grouped[quiz.chapterTitle] = [];
        }
        grouped[quiz.chapterTitle].push(quiz);
    });

    return grouped;
};

const getQuizzesByChapter = async (chapterTitle) => {
    const quizzes = await quizRepository.findByChapter(chapterTitle);
    if (quizzes.length === 0) {
        throw new ApiError(404, 'No quizzes found for this chapter');
    }
    return quizzes;
};

const getExamQuestions = async () => {
    // Total desired exam questions
    const TARGET_COUNT = 60;

    // Fetch all quizzes and group them by chapter
    const allQuizzes = await quizRepository.findAll();

    const totalAvailable = allQuizzes.length;

    // If there are fewer than TARGET_COUNT available, return them all shuffled
    if (totalAvailable <= TARGET_COUNT) {
        const shuffled = allQuizzes.sort(() => Math.random() - 0.5);
        return shuffled.map(q => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            chapterTitle: q.chapterTitle,
            difficulty: q.difficulty
        }));
    }

    // Group questions by the chapterTitle stored with each question.
    const chaptersMap = {};
    for (const q of allQuizzes) {
        if (!chaptersMap[q.chapterTitle]) chaptersMap[q.chapterTitle] = [];
        chaptersMap[q.chapterTitle].push(q);
    }

    const chapters = Object.keys(chaptersMap).map(title => ({
        title,
        questions: chaptersMap[title],
        count: chaptersMap[title].length
    }));

    // 1) Compute ideal (float) quotas per chapter: (chapterCount / totalAvailable) * TARGET_COUNT
    // 2) Floor them to get initial integer quotas and keep remainders for fair distribution
    let allocated = 0;
    for (const c of chapters) {
        const floatQuota = (c.count / totalAvailable) * TARGET_COUNT;
        c.floatQuota = floatQuota;
        c.allocated = Math.floor(floatQuota);
        // Ensure we never request more than the chapter actually has
        if (c.allocated > c.count) c.allocated = c.count;
        // Ensure every chapter with questions gets at least 1 if possible
        if (c.count > 0 && c.allocated === 0) c.allocated = 1;
        allocated += c.allocated;
        c.remainder = floatQuota - Math.floor(floatQuota);
    }

    // Adjust allocations to exactly TARGET_COUNT
    // If we are below target, distribute extra slots to chapters with largest remainders and available questions
    if (allocated < TARGET_COUNT) {
        // Sort by remainder (desc) to assign fractional leftovers fairly
        const byRemainder = chapters
            .slice()
            .sort((a, b) => b.remainder - a.remainder);

        let i = 0;
        while (allocated < TARGET_COUNT) {
            const c = byRemainder[i % byRemainder.length];
            // Only add if chapter still has unallocated questions
            if (c.allocated < c.count) {
                c.allocated += 1;
                allocated += 1;
            }
            i += 1;
            // Safety: if we've looped many times and cannot allocate further, break
            if (i > byRemainder.length * 10) break;
        }
    }

    // If we are above target (possible after forcing at least 1 per chapter), remove random extras
    if (allocated > TARGET_COUNT) {
        // Flatten list of chapters that can give up at least one question (allocated > 1)
        const donors = chapters.filter(c => c.allocated > 1);
        while (allocated > TARGET_COUNT && donors.length > 0) {
            // pick random donor
            const idx = Math.floor(Math.random() * donors.length);
            const donor = donors[idx];
            donor.allocated -= 1;
            allocated -= 1;
            if (donor.allocated <= 1) {
                // remove from donors if can't give more
                donors.splice(idx, 1);
            }
        }
        // If still above target (edge-case), trim from chapters sequentially
        if (allocated > TARGET_COUNT) {
            for (const c of chapters) {
                while (allocated > TARGET_COUNT && c.allocated > 0) {
                    c.allocated -= 1;
                    allocated -= 1;
                }
                if (allocated === TARGET_COUNT) break;
            }
        }
    }

    // Now sample allocated count randomly from each chapter without exceeding availability
    const selected = [];
    for (const c of chapters) {
        const pool = c.questions.slice();
        // shuffle pool (Fisher-Yates)
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const take = Math.min(c.allocated, pool.length);
        for (let k = 0; k < take; k++) selected.push(pool[k]);
    }

    // At this point, due to capping, we may still be under TARGET_COUNT; if so, add random remaining questions
    if (selected.length < TARGET_COUNT) {
        const remainingPool = [];
        for (const c of chapters) {
            // collect remaining questions not already selected
            const selectedIds = new Set(selected.map(s => s._id.toString()));
            for (const q of c.questions) {
                if (!selectedIds.has(q._id.toString())) remainingPool.push(q);
            }
        }
        // shuffle and add until TARGET_COUNT or exhausted
        for (let i = remainingPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingPool[i], remainingPool[j]] = [remainingPool[j], remainingPool[i]];
        }
        let idx = 0;
        while (selected.length < TARGET_COUNT && idx < remainingPool.length) {
            selected.push(remainingPool[idx++]);
        }
    }

    // If we somehow have more than TARGET_COUNT, remove random extras until exact
    while (selected.length > TARGET_COUNT) {
        const idx = Math.floor(Math.random() * selected.length);
        selected.splice(idx, 1);
    }

    // Final shuffle of selected questions
    for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
    }

    // Remove correctAnswer and explanation for exam mode and include display fields
    // We intentionally exclude correctAnswer, correctAnswerAR, explanation, explanationAR
    // while providing Arabic and media fields required by the frontend display.
    return selected.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        chapterTitle: q.chapterTitle,
        difficulty: q.difficulty,
        image: q.image || null,
        video: q.video || null,
        questionAR: q.questionAR || null,
        optionsAR: q.optionsAR || null,
        chapterTitleAR: q.chapterTitleAR || null
    }));
};

const submitQuiz = async (userId, answers) => {
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
        throw new ApiError(400, 'Answers array is required');
    }

    const questionIds = answers.map(a => a.questionId);
    const questions = await quizRepository.findByIds(questionIds);

    const questionMap = {};
    for (const q of questions) {
        questionMap[q._id.toString()] = q;
    }

    let correct = 0;
    const results = [];

    for (const answer of answers) {
        const question = questionMap[answer.questionId];
        if (!question) continue;

        // Support selectedAnswer as: English text, Arabic text, or an option index
        const sel = answer.selectedAnswer;

        let isCorrect = false;
        let selectedText = sel;

        // Helper to safely get option by index
        const getOptionByIndex = (opts, idx) => {
            if (!Array.isArray(opts)) return undefined;
            if (idx < 0 || idx >= opts.length) return undefined;
            return opts[idx];
        };

        // If selected is numeric (index) or numeric-like string, treat as index
        if (typeof sel === 'number' || (typeof sel === 'string' && /^\d+$/.test(sel))) {
            const idx = Number(sel);
            const engOpt = getOptionByIndex(question.options, idx);
            const arOpt = getOptionByIndex(question.optionsAR, idx);
            // prefer English text if exists
            selectedText = engOpt !== undefined ? engOpt : (arOpt !== undefined ? arOpt : sel);

            const correctEng = question.correctAnswer;
            const correctAr = question.correctAnswerAR;

            if ((engOpt && correctEng && engOpt === correctEng) || (arOpt && correctAr && arOpt === correctAr)) {
                isCorrect = true;
            }
        } else {
            // selected as text (could be English or Arabic)
            selectedText = sel;
            const correctEng = question.correctAnswer;
            const correctAr = question.correctAnswerAR;

            if ((correctEng && selectedText === correctEng) || (correctAr && selectedText === correctAr)) {
                isCorrect = true;
            } else {
                // Also consider matching by comparing selectedText to the option at the index of correctAnswer
                // (covers cases where correctAnswer is text but optionsAR contains equivalent at same index)
                if (Array.isArray(question.options) && Array.isArray(question.optionsAR) && correctEng) {
                    const correctIndex = question.options.indexOf(correctEng);
                    if (correctIndex !== -1) {
                        const arAtIndex = question.optionsAR[correctIndex];
                        if (arAtIndex && selectedText === arAtIndex) {
                            isCorrect = true;
                        }
                    }
                }
            }
        }

        if (isCorrect) correct++;

        // Build bilingual/media-aware review item
        results.push({
            questionId: answer.questionId,
            question: question.question,
            options: question.options,
            selectedAnswer: selectedText,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            questionAR: question.questionAR || null,
            optionsAR: question.optionsAR || null,
            correctAnswerAR: question.correctAnswerAR || null,
            explanationAR: question.explanationAR || null,
            chapterTitle: question.chapterTitle,
            chapterTitleAR: question.chapterTitleAR || null,
            image: question.image || null,
            video: question.video || null,
            isCorrect
        });
    }

    const totalQuestions = results.length;
    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    // Save quiz result to progress
    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
        progress = await progressRepository.createForUser(userId);
    }

    // Determine chapter from the majority of questions
    const chapterCounts = {};
    for (const r of results) {
        const q = questionMap[r.questionId];
        if (q) {
            chapterCounts[q.chapterTitle] = (chapterCounts[q.chapterTitle] || 0) + 1;
        }
    }
    const chapterTitle = Object.keys(chapterCounts).sort((a, b) => chapterCounts[b] - chapterCounts[a])[0] || 'Exam';

    progress.quizResults.push({ chapterTitle, score, totalQuestions });
    await progressRepository.update(progress._id, { quizResults: progress.quizResults });

    return { score, totalQuestions, correct, results };
};

const createQuiz = async (data) => {
    return quizRepository.create(data);
};

const updateQuiz = async (id, data) => {
    const quiz = await quizRepository.updateById(id, data);
    if (!quiz) {
        throw new ApiError(404, 'Quiz question not found');
    }
    return quiz;
};

const deleteQuiz = async (id) => {
    const quiz = await quizRepository.deleteById(id);
    if (!quiz) {
        throw new ApiError(404, 'Quiz question not found');
    }
    return { message: 'Quiz question deleted successfully' };
};

module.exports = { getAllQuizzes, getQuizzesByChapter, getExamQuestions, submitQuiz, createQuiz, updateQuiz, deleteQuiz };
