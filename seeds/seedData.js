const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');

dotenv.config();

const usersData = [
    {
        name: 'Student User',
        email: 'student@driving.com',
        password: 'student123',
        role: 'student'
    },
    {
        name: 'Admin User',
        email: 'admin@driving.com',
        password: 'admin123',
        role: 'admin'
    }
];

const lessonsData = [
    {
        title: 'Basic Driving Skills',
        description: 'Learn the fundamental steps before and during driving.',
        image: '',
        order: 1,
        isPublished: true,
        lessons: [
            {
                title: 'Getting into the Car',
                content: 'Before entering the vehicle, walk around it to check for obstacles. Adjust your seat so you can reach the pedals comfortably. Adjust all mirrors (rearview and side mirrors) for clear visibility. Always fasten your seatbelt before starting the engine.'
            },
            {
                title: 'Starting the Car',
                content: 'Ensure the gear is in Park (automatic) or Neutral (manual). Press the brake pedal firmly. Turn the ignition key or press the start button. Check all dashboard indicators before moving. Release the parking brake when ready to drive.'
            },
            {
                title: 'Basic Vehicle Controls',
                content: 'The steering wheel controls direction. The accelerator pedal increases speed. The brake pedal slows or stops the vehicle. The turn signals indicate your intended direction to other drivers. Use mirrors frequently to stay aware of your surroundings.'
            }
        ]
    },
    {
        title: 'Traffic Signs',
        description: 'Understand the most important road signs and their meanings.',
        image: '',
        order: 2,
        isPublished: true,
        lessons: [
            {
                title: 'Warning Signs',
                content: 'Warning signs are usually yellow or orange with a diamond shape. They alert drivers to upcoming hazards such as sharp curves, steep hills, pedestrian crossings, animal crossings, and road construction. Always reduce speed when you see a warning sign.'
            },
            {
                title: 'Mandatory Signs',
                content: 'Mandatory signs are circular with a blue background. They tell drivers what they MUST do, such as: turn right only, keep left, minimum speed required, or use a specific lane. Failing to follow mandatory signs is a traffic violation.'
            },
            {
                title: 'Prohibitory Signs',
                content: 'Prohibitory signs are circular with a red border. They tell drivers what they CANNOT do: no entry, no parking, no U-turn, no overtaking, or speed limits. A red circle with a diagonal line means the action shown is forbidden.'
            },
            {
                title: 'Informational Signs',
                content: 'Informational signs are usually rectangular with a blue or green background. They provide useful information such as: hospital nearby, gas station ahead, highway exit numbers, and distance to the next city. They do not require any specific action.'
            }
        ]
    },
    {
        title: 'Road Priorities & Right of Way',
        description: 'Master who has the right of way in different traffic situations.',
        image: '',
        order: 3,
        isPublished: true,
        lessons: [
            {
                title: 'Priority at Intersections',
                content: 'At an uncontrolled intersection, the vehicle on the right generally has priority. At a controlled intersection, follow traffic lights and signs. A yield sign means you must slow down and give way to traffic on the main road. A stop sign means you must stop completely before proceeding.'
            },
            {
                title: 'Pedestrian Priority',
                content: 'Pedestrians have the right of way at marked crosswalks. When a pedestrian is crossing, all vehicles must stop. Near schools and hospitals, extra caution is required. Even at unmarked crossings, drivers should yield to pedestrians who have already started crossing.'
            },
            {
                title: 'Emergency Vehicles',
                content: 'When you hear a siren or see flashing lights from an emergency vehicle (ambulance, police, fire truck), you must pull over safely to the right and stop. Do not follow or obstruct emergency vehicles. Failing to yield to emergency vehicles is a serious traffic violation.'
            }
        ]
    },
    {
        title: 'Speed Limits & Safe Following',
        description: 'Understand speed regulations and safe following distances.',
        image: '',
        order: 4,
        isPublished: true,
        lessons: [
            {
                title: 'Speed Limit Rules',
                content: 'Speed limits vary by area: residential zones are typically 30-50 km/h, urban roads 50-60 km/h, highways 80-120 km/h. Always obey posted speed limit signs as they override general rules. Speed limits are reduced in school zones, construction areas, and during bad weather.'
            },
            {
                title: 'Safe Following Distance',
                content: 'The 3-second rule: pick a fixed point, when the car ahead passes it, count 3 seconds. If you reach the point before 3 seconds, you are too close. In rain, increase to 4-6 seconds. In fog or ice, increase to 8-10 seconds. Tailgating is a leading cause of rear-end collisions.'
            },
            {
                title: 'Driving in Bad Weather',
                content: 'In rain: reduce speed, increase following distance, turn on headlights. In fog: use low-beam headlights or fog lights, reduce speed significantly. In snow or ice: drive slowly, avoid sudden braking and steering. In strong winds: grip the steering wheel firmly, be cautious around large vehicles.'
            }
        ]
    },
    {
        title: 'Seat Belt Safety & Passenger Rules',
        description: 'Learn the importance of seat belts and rules for carrying passengers.',
        image: '',
        order: 5,
        isPublished: true,
        lessons: [
            {
                title: 'Seat Belt Laws',
                content: 'Seat belts are mandatory for all occupants (driver and passengers) in most countries. Seat belts reduce the risk of death by up to 45% in front seats and 25% in rear seats. Children under a certain age or height must use appropriate child safety seats. The driver is responsible for ensuring all passengers wear seat belts.'
            },
            {
                title: 'Child Safety Seats',
                content: 'Infants (0-1 year) must use rear-facing car seats. Toddlers (1-4 years) should use forward-facing car seats with a harness. Children (4-8 years) should use booster seats. Children under 12 should always sit in the back seat. Never place a rear-facing car seat in front of an active airbag.'
            }
        ]
    }
];

const quizzesData = [
    // Chapter: Basic Driving Skills
    {
        question: 'What is the first thing you should do before starting the car?',
        options: ['Turn on the radio', 'Fasten your seatbelt', 'Check your phone', 'Adjust the AC'],
        correctAnswer: 'Fasten your seatbelt',
        chapterTitle: 'Basic Driving Skills',
        explanation: 'Safety first — always fasten your seatbelt before starting the engine.',
        difficulty: 'easy'
    },
    {
        question: 'What should you check before entering a vehicle?',
        options: ['Walk around and check for obstacles', 'Nothing, just get in', 'Honk the horn', 'Flash the headlights'],
        correctAnswer: 'Walk around and check for obstacles',
        chapterTitle: 'Basic Driving Skills',
        explanation: 'A safety walk-around helps you spot any obstacles, children, or animals near the vehicle.',
        difficulty: 'easy'
    },
    {
        question: 'What gear should an automatic car be in before starting?',
        options: ['Drive', 'Reverse', 'Park', 'Neutral'],
        correctAnswer: 'Park',
        chapterTitle: 'Basic Driving Skills',
        explanation: 'An automatic car should be in Park (P) before starting the engine to prevent movement.',
        difficulty: 'easy'
    },
    {
        question: 'Which pedal should you press before starting the engine?',
        options: ['Accelerator', 'Brake', 'Clutch only', 'None'],
        correctAnswer: 'Brake',
        chapterTitle: 'Basic Driving Skills',
        explanation: 'Pressing the brake pedal is required in most modern vehicles before the engine can be started.',
        difficulty: 'medium'
    },
    // Chapter: Traffic Signs
    {
        question: 'What does a red stop sign mean?',
        options: ['Slow down only', 'Stop completely', 'Parking allowed', 'Turn right only'],
        correctAnswer: 'Stop completely',
        chapterTitle: 'Traffic Signs',
        explanation: 'A red stop sign requires the driver to stop the vehicle completely before proceeding.',
        difficulty: 'easy'
    },
    {
        question: 'What shape are warning signs typically?',
        options: ['Circular', 'Diamond or triangular', 'Square', 'Octagonal'],
        correctAnswer: 'Diamond or triangular',
        chapterTitle: 'Traffic Signs',
        explanation: 'Warning signs are usually diamond-shaped (in North America) or triangular (internationally) with yellow or orange colors.',
        difficulty: 'easy'
    },
    {
        question: 'A circular sign with a red border indicates what?',
        options: ['A warning', 'A prohibition', 'Information', 'A mandatory action'],
        correctAnswer: 'A prohibition',
        chapterTitle: 'Traffic Signs',
        explanation: 'Circular signs with red borders are prohibitory signs that tell drivers what they cannot do.',
        difficulty: 'medium'
    },
    {
        question: 'What does a blue circular sign indicate?',
        options: ['Warning', 'Prohibition', 'Mandatory action', 'Speed limit'],
        correctAnswer: 'Mandatory action',
        chapterTitle: 'Traffic Signs',
        explanation: 'Blue circular signs are mandatory signs that tell drivers what they must do.',
        difficulty: 'medium'
    },
    {
        question: 'What color background do informational road signs usually have?',
        options: ['Red', 'Yellow', 'Blue or green', 'Orange'],
        correctAnswer: 'Blue or green',
        chapterTitle: 'Traffic Signs',
        explanation: 'Informational signs typically have blue or green backgrounds and provide useful information like distances and services.',
        difficulty: 'easy'
    },
    // Chapter: Road Priorities & Right of Way
    {
        question: 'Who has priority at a pedestrian crossing?',
        options: ['The fastest car', 'The pedestrian', 'The larger vehicle', 'The vehicle on the left'],
        correctAnswer: 'The pedestrian',
        chapterTitle: 'Road Priorities & Right of Way',
        explanation: 'Pedestrians always have the right of way at marked pedestrian crossings.',
        difficulty: 'easy'
    },
    {
        question: 'What should a driver do when an ambulance is approaching?',
        options: ['Continue driving normally', 'Speed up to get out of the way', 'Pull over safely to the right and stop', 'Stop in the middle of the road'],
        correctAnswer: 'Pull over safely to the right and stop',
        chapterTitle: 'Road Priorities & Right of Way',
        explanation: 'Drivers must safely pull to the right and stop to allow emergency vehicles to pass.',
        difficulty: 'easy'
    },
    {
        question: 'At an uncontrolled intersection, who generally has priority?',
        options: ['The vehicle on the left', 'The vehicle on the right', 'The faster vehicle', 'The larger vehicle'],
        correctAnswer: 'The vehicle on the right',
        chapterTitle: 'Road Priorities & Right of Way',
        explanation: 'At uncontrolled intersections, the general rule is to yield to the vehicle approaching from your right.',
        difficulty: 'medium'
    },
    {
        question: 'What does a yield sign require you to do?',
        options: ['Stop completely always', 'Slow down and give way to other traffic', 'Speed up to merge', 'Honk and proceed'],
        correctAnswer: 'Slow down and give way to other traffic',
        chapterTitle: 'Road Priorities & Right of Way',
        explanation: 'A yield sign means you must slow down and let other traffic pass before proceeding if necessary.',
        difficulty: 'medium'
    },
    // Chapter: Speed Limits & Safe Following
    {
        question: 'What is the typical speed limit in a residential zone?',
        options: ['80-100 km/h', '30-50 km/h', '120 km/h', '10 km/h'],
        correctAnswer: '30-50 km/h',
        chapterTitle: 'Speed Limits & Safe Following',
        explanation: 'Residential areas typically have speed limits of 30-50 km/h to ensure safety of residents and pedestrians.',
        difficulty: 'easy'
    },
    {
        question: 'What is the 3-second rule used for?',
        options: ['Checking mirrors', 'Timing traffic lights', 'Maintaining safe following distance', 'Parking timing'],
        correctAnswer: 'Maintaining safe following distance',
        chapterTitle: 'Speed Limits & Safe Following',
        explanation: 'The 3-second rule helps you maintain a safe following distance from the vehicle ahead of you.',
        difficulty: 'easy'
    },
    {
        question: 'In rainy conditions, what should you increase the following distance to?',
        options: ['1-2 seconds', '3 seconds', '4-6 seconds', 'No change needed'],
        correctAnswer: '4-6 seconds',
        chapterTitle: 'Speed Limits & Safe Following',
        explanation: 'In rain, roads become slippery so you need 4-6 seconds of following distance for safe braking.',
        difficulty: 'medium'
    },
    {
        question: 'What type of headlights should you use in fog?',
        options: ['High beams', 'Low beams or fog lights', 'No lights', 'Hazard lights only'],
        correctAnswer: 'Low beams or fog lights',
        chapterTitle: 'Speed Limits & Safe Following',
        explanation: 'High beams reflect off fog and reduce visibility. Low beams or fog lights point downward and improve visibility.',
        difficulty: 'medium'
    },
    {
        question: 'What is a leading cause of rear-end collisions?',
        options: ['Turning too slowly', 'Tailgating', 'Using turn signals', 'Driving below the speed limit'],
        correctAnswer: 'Tailgating',
        chapterTitle: 'Speed Limits & Safe Following',
        explanation: 'Tailgating (following too closely) does not leave enough stopping distance and is a leading cause of rear-end collisions.',
        difficulty: 'hard'
    },
    // Chapter: Seat Belt Safety & Passenger Rules
    {
        question: 'By how much can seat belts reduce the risk of death in front seats?',
        options: ['10%', '25%', '45%', '80%'],
        correctAnswer: '45%',
        chapterTitle: 'Seat Belt Safety & Passenger Rules',
        explanation: 'Studies show that seat belts reduce the risk of death by approximately 45% for front-seat occupants.',
        difficulty: 'medium'
    },
    {
        question: 'Where should children under 12 sit in a vehicle?',
        options: ['Front passenger seat', 'On the driver\'s lap', 'In the back seat', 'Anywhere they want'],
        correctAnswer: 'In the back seat',
        chapterTitle: 'Seat Belt Safety & Passenger Rules',
        explanation: 'Children under 12 should always ride in the back seat, away from front airbags that can be dangerous to them.',
        difficulty: 'easy'
    },
    {
        question: 'What type of car seat should an infant (0-1 year) use?',
        options: ['Forward-facing seat', 'Booster seat', 'Rear-facing seat', 'Regular seat belt'],
        correctAnswer: 'Rear-facing seat',
        chapterTitle: 'Seat Belt Safety & Passenger Rules',
        explanation: 'Infants must use rear-facing car seats because their neck and spine are not yet strong enough for forward impact.',
        difficulty: 'medium'
    },
    {
        question: 'Who is responsible for ensuring all passengers wear seat belts?',
        options: ['Each passenger', 'The front passenger', 'The driver', 'Nobody'],
        correctAnswer: 'The driver',
        chapterTitle: 'Seat Belt Safety & Passenger Rules',
        explanation: 'In most jurisdictions, the driver is legally responsible for making sure all passengers are wearing seat belts.',
        difficulty: 'hard'
    }
];

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Lesson.deleteMany({}),
            Quiz.deleteMany({}),
            Progress.deleteMany({})
        ]);

        // Create users with hashed passwords
        const salt = await bcrypt.genSalt(10);
        const usersWithHashedPasswords = await Promise.all(
            usersData.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, salt)
            }))
        );

        await User.insertMany(usersWithHashedPasswords);
        await Lesson.insertMany(lessonsData);
        await Quiz.insertMany(quizzesData);

        console.log('Seed data inserted successfully:');
        console.log(`  - ${usersWithHashedPasswords.length} users (student@driving.com / student123, admin@driving.com / admin123)`);
        console.log(`  - ${lessonsData.length} chapters with ${lessonsData.reduce((sum, l) => sum + l.lessons.length, 0)} sub-lessons`);
        console.log(`  - ${quizzesData.length} quiz questions`);

        process.exit(0);
    } catch (error) {
        console.error('Failed to seed data:', error.message);
        process.exit(1);
    }
};

seedData();
