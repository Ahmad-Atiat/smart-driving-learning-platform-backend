// Canonical chapters — must match the chapterTitle values in seeds/questions/*.json
// and the top-level titles in seeds/Lessons/*.js. Aliases cover minor spelling
// differences (e.g. هَمزة) between the quiz dataset and the lesson dataset so the
// title-to-key lookup keeps working from either source.
const QUIZ_CHAPTERS = [
    {
        chapterKey: 'traffic-rules-and-priorities',
        title: 'Traffic Rules and Priorities',
        titleAR: 'قواعد واولويات المرور',
        aliases: [
            'Traffic Rules and Priorities',
            'Road Priorities',
            'Right of Way and Road Priorities',
            'Road Priorities and Right of Way',
            'قواعد و أولويات المرور',
            'قواعد وأولويات المرور'
        ]
    },
    {
        chapterKey: 'traffic-signs',
        title: 'Traffic Signs',
        titleAR: 'شواخص المرور',
        aliases: ['Traffic Signs']
    },
    {
        chapterKey: 'road-lines-and-ground-markings',
        title: 'Road Lines and Ground Markings',
        titleAR: 'الخطوط والعلامات الأرضية',
        aliases: [
            'Road Lines and Ground Markings',
            'Road Markings',
            'الخطوط والعلامات الارضية'
        ]
    },
    {
        chapterKey: 'driver-behavior',
        title: 'Driver Behavior',
        titleAR: 'سلوكيات السائقين',
        aliases: ['Driver Behavior']
    },
    {
        chapterKey: 'jordanian-traffic-law',
        title: 'Jordanian Traffic Law',
        titleAR: 'قانون السير الاردني',
        aliases: ['Jordanian Traffic Law', 'قانون السير الأردني']
    },
    {
        chapterKey: 'traffic-violations',
        title: 'Traffic Violations',
        titleAR: 'مخالفات السير',
        aliases: ['Traffic Violations']
    },
    {
        chapterKey: 'first-aid',
        title: 'First Aid',
        titleAR: 'الإسعافات الأولية',
        aliases: ['First Aid', 'الاسعافات الاولية']
    },
    {
        chapterKey: 'car-mechanics',
        title: 'Car Mechanics',
        titleAR: 'ميكانيك السيارات',
        aliases: ['Car Mechanics']
    },
    {
        chapterKey: 'license-category-5-6',
        title: 'Fifth and Sixth License Categories',
        titleAR: 'الفئات الخامسة والسادسة',
        aliases: [
            'Fifth and Sixth License Categories',
            'License Category 5 and 6',
            'License Categories 5 and 6'
        ]
    },
    {
        chapterKey: 'animated-questions',
        title: 'Animated Questions',
        titleAR: 'اسئلة متحركة',
        aliases: ['Animated Questions', 'أسئلة متحركة']
    }
];

const CHAPTERS = [...QUIZ_CHAPTERS];

const normalizeTitle = (value) =>
    typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';

const byKey = new Map();
const keyByTitle = new Map();

for (const chapter of CHAPTERS) {
    byKey.set(chapter.chapterKey, chapter);
    keyByTitle.set(normalizeTitle(chapter.title), chapter.chapterKey);
    keyByTitle.set(normalizeTitle(chapter.titleAR), chapter.chapterKey);
    for (const alias of chapter.aliases) {
        keyByTitle.set(normalizeTitle(alias), chapter.chapterKey);
    }
}

const getChapterByKey = (chapterKey) => byKey.get(chapterKey) || null;

const getChapterByTitle = (chapterTitle) => {
    const chapterKey = keyByTitle.get(normalizeTitle(chapterTitle));
    return chapterKey ? getChapterByKey(chapterKey) : null;
};

const getChapterByKeyOrTitle = (value) =>
    getChapterByKey(value) || getChapterByTitle(value);

const getChapterKeyForTitle = (chapterTitle) =>
    getChapterByTitle(chapterTitle)?.chapterKey || null;

const getQuizTitleAliasesForKey = (chapterKey) => {
    const chapter = getChapterByKey(chapterKey);
    return chapter ? Array.from(new Set([chapter.title, ...chapter.aliases])) : [];
};

module.exports = {
    CHAPTERS,
    getChapterByKey,
    getChapterByTitle,
    getChapterByKeyOrTitle,
    getChapterKeyForTitle,
    getQuizTitleAliasesForKey
};
