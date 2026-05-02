const CHAPTERS = [
    {
        chapterKey: 'basic-driving-skills',
        title: 'Basic Driving Skills',
        aliases: ['Basic Driving Skills']
    },
    {
        chapterKey: 'traffic-signs',
        title: 'Traffic Signs',
        aliases: ['Traffic Signs']
    },
    {
        chapterKey: 'road-priorities-right-of-way',
        title: 'Road Priorities and Right of Way',
        aliases: ['Right of Way and Road Priorities']
    },
    {
        chapterKey: 'speed-limits-safe-driving',
        title: 'Speed Limits and Safe Driving',
        aliases: ['Speed Limits and Safe Driving Distance']
    },
    {
        chapterKey: 'safety-systems-vehicle-safety',
        title: 'Safety Systems and Vehicle Safety',
        aliases: ['Seat Belt and Passenger Safety Rules']
    },
    {
        chapterKey: 'traffic-laws-violations',
        title: 'Traffic Laws and Violations',
        aliases: ['Driving and Alcohol Laws', 'Driving License Categories and Vehicle Types']
    },
    {
        chapterKey: 'vehicle-mechanics-maintenance',
        title: 'Vehicle Mechanics and Maintenance',
        aliases: ['Vehicle Maintenance and Basic Mechanics']
    },
    {
        chapterKey: 'fuel-economy-environment',
        title: 'Fuel Economy and Environment',
        aliases: ['Fuel Economy and Environment']
    },
    {
        chapterKey: 'emergency-first-aid',
        title: 'Emergency Situations and First Aid',
        aliases: ['First Aid and Emergency Situations']
    }
];

const normalizeTitle = (value) =>
    typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';

const byKey = new Map();
const keyByTitle = new Map();

for (const chapter of CHAPTERS) {
    byKey.set(chapter.chapterKey, chapter);
    keyByTitle.set(normalizeTitle(chapter.title), chapter.chapterKey);
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
