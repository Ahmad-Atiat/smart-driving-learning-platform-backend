const dotenv = require('dotenv');

const connectDB = require('../config/db');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');

dotenv.config();

const lessonsData = [
    {
        title: 'Basic Driving Skills',
        description: 'This chapter explains the basic steps before and during driving.',
        image: 'basic-driving.jpg',
        order: 1,
        isPublished: true,
        lessons: [
            {
                title: 'Getting into the Car',
                content: 'Adjust your seat, mirrors, and fasten your seatbelt before starting the car.'
            },
            {
                title: 'Starting the Car',
                content: 'Make sure the gear is correct, press the brake, and start the engine safely.'
            }
        ]
    },
    {
        title: 'Traffic Signs',
        description: 'This chapter explains the most important road signs and their meanings.',
        image: 'traffic-signs.jpg',
        order: 2,
        isPublished: true,
        lessons: [
            {
                title: 'Warning Signs',
                content: 'Warning signs alert drivers to hazards such as curves, bumps, or pedestrian crossings.'
            },
            {
                title: 'Mandatory Signs',
                content: 'Mandatory signs tell drivers what they must do, such as turning in a certain direction.'
            },
            {
                title: 'Prohibitory Signs',
                content: 'Prohibitory signs tell drivers what they are not allowed to do, such as no parking or no entry.'
            }
        ]
    },
    {
        title: 'Road Priorities',
        description: 'This chapter explains who has the right of way in different traffic situations.',
        image: 'priorities.jpg',
        order: 3,
        isPublished: true,
        lessons: [
            {
                title: 'Priority at Intersections',
                content: 'Drivers must understand who moves first at intersections based on signs and road rules.'
            },
            {
                title: 'Pedestrian Priority',
                content: 'Pedestrians usually have priority at designated crossings.'
            },
            {
                title: 'Emergency Vehicles',
                content: 'Drivers must give way to ambulances, police cars, and fire trucks when necessary.'
            }
        ]
    }
];

const quizzesData = [
    {
        question: 'What does a red stop sign mean?',
        options: ['Slow down only', 'Stop completely', 'Parking allowed', 'Turn right only'],
        correctAnswer: 'Stop completely',
        chapterTitle: 'Traffic Signs',
        explanation: 'A red stop sign means the driver must stop the vehicle completely before moving.',
        difficulty: 'easy'
    },
    {
        question: 'Who has priority at a pedestrian crossing?',
        options: ['The fastest car', 'The pedestrian', 'The larger vehicle', 'The vehicle on the left'],
        correctAnswer: 'The pedestrian',
        chapterTitle: 'Road Priorities',
        explanation: 'Pedestrians usually have the right of way at marked pedestrian crossings.',
        difficulty: 'easy'
    },
    {
        question: 'What should a driver do when an ambulance is approaching?',
        options: ['Continue driving normally', 'Race the ambulance', 'Give way safely', 'Park in the middle of the road'],
        correctAnswer: 'Give way safely',
        chapterTitle: 'Road Priorities',
        explanation: 'Drivers must give way to emergency vehicles when it is safe to do so.',
        difficulty: 'medium'
    }
];

const seedData = async () => {
    try {
        await connectDB();

        await Promise.all([Lesson.deleteMany({}), Quiz.deleteMany({})]);
        await Lesson.insertMany(lessonsData);
        await Quiz.insertMany(quizzesData);

        console.log('Seed data inserted successfully');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed data:', error.message);
        process.exit(1);
    }
};

seedData();