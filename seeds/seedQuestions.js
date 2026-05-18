const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Quiz = require('../models/Quiz');

dotenv.config();

const QUESTIONS_DIR = path.join(__dirname, 'questions');

// Required English/Arabic fields per question; we only validate, never modify.
const REQUIRED_FIELDS = [
    'question',
    'options',
    'correctAnswer',
    'chapterTitle',
    'questionAR',
    'optionsAR',
    'correctAnswerAR',
    'chapterTitleAR'
];

const loadQuestionsFromDir = (dir) => {
    if (!fs.existsSync(dir)) {
        throw new Error(`Questions directory not found: ${dir}`);
    }

    const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.json'));
    if (files.length === 0) {
        throw new Error(`No JSON files found in: ${dir}`);
    }

    const allQuestions = [];
    const perFile = {};
    const sourceFileByIndex = [];

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const raw = fs.readFileSync(fullPath, 'utf8');
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            throw new Error(`Failed to parse ${file}: ${err.message}`);
        }
        if (!Array.isArray(parsed)) {
            throw new Error(`Expected an array in ${file}, got ${typeof parsed}`);
        }
        perFile[file] = parsed.length;
        for (const q of parsed) {
            allQuestions.push(q);
            sourceFileByIndex.push(file);
        }
    }

    return { files, perFile, allQuestions, sourceFileByIndex };
};

// Returns an array of warning strings. Never mutates the question.
const validateQuestion = (q, index, file) => {
    const warnings = [];
    const where = `[${file}#${index} number=${q?.number ?? 'n/a'}]`;

    for (const field of REQUIRED_FIELDS) {
        if (q[field] === undefined || q[field] === null || q[field] === '') {
            warnings.push(`${where} missing ${field}`);
        }
    }

    if (Array.isArray(q.options)) {
        if (q.options.length < 2 || q.options.length > 4) {
            warnings.push(`${where} options length ${q.options.length} not in [2,4]`);
        }
    }
    if (Array.isArray(q.optionsAR)) {
        if (q.optionsAR.length < 2 || q.optionsAR.length > 4) {
            warnings.push(`${where} optionsAR length ${q.optionsAR.length} not in [2,4]`);
        }
    }

    if (Array.isArray(q.options) && q.correctAnswer && !q.options.includes(q.correctAnswer)) {
        warnings.push(`${where} correctAnswer not present in options`);
    }
    if (Array.isArray(q.optionsAR) && q.correctAnswerAR && !q.optionsAR.includes(q.correctAnswerAR)) {
        warnings.push(`${where} correctAnswerAR not present in optionsAR`);
    }

    return warnings;
};

const seedQuestions = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not set in environment variables');
        }

        const { files, perFile, allQuestions, sourceFileByIndex } = loadQuestionsFromDir(QUESTIONS_DIR);

        console.log('--- Quiz Seed ---');
        console.log(`Loaded ${files.length} JSON files from ${QUESTIONS_DIR}:`);
        for (const f of files) {
            console.log(`  - ${f} (${perFile[f]} questions)`);
        }

        let allWarnings = [];
        const perChapter = {};
        allQuestions.forEach((q, idx) => {
            const file = sourceFileByIndex[idx] || 'combined';
            const warnings = validateQuestion(q, idx, file);
            allWarnings = allWarnings.concat(warnings);

            const title = q?.chapterTitle || 'Unknown';
            perChapter[title] = (perChapter[title] || 0) + 1;
        });

        console.log(`Total questions combined: ${allQuestions.length}`);
        console.log('Per-chapter counts:');
        for (const [title, count] of Object.entries(perChapter)) {
            console.log(`  - ${title}: ${count}`);
        }

        if (allWarnings.length > 0) {
            console.warn(`Validation warnings: ${allWarnings.length}`);
            for (const w of allWarnings.slice(0, 50)) {
                console.warn(`  ! ${w}`);
            }
            if (allWarnings.length > 50) {
                console.warn(`  ! ...and ${allWarnings.length - 50} more`);
            }
        } else {
            console.log('Validation warnings: 0');
        }

        await mongoose.connect(mongoUri);

        const { deletedCount } = await Quiz.deleteMany({});
        console.log(`Cleared Quiz collection: deleted ${deletedCount} existing questions`);

        await Quiz.insertMany(allQuestions, { ordered: false });
        const totalInserted = await Quiz.countDocuments();
        console.log(`Inserted questions: ${totalInserted}`);

        const insertedPerChapter = await Quiz.aggregate([
            { $group: { _id: '$chapterTitle', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        console.log('Inserted per-chapter counts:');
        for (const row of insertedPerChapter) {
            console.log(`  - ${row._id}: ${row.count}`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed questions:', error.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

seedQuestions();
