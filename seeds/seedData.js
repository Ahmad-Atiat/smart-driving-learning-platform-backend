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
"title": "Basic Driving Skills",
"description": "Comprehensive coverage of fundamental driving skills including vehicle preparation, control systems, lane usage, overtaking procedures, and essential techniques for safe driving as outlined in the Jordanian driving curriculum.",
"image": "",
"order": 1,
"isPublished": true,
"lessons": [
{
"title": "Introduction to Basic Driving Skills",
"content": "Basic driving skills form the foundation of safe and responsible driving. In Jordan, traffic accidents have become a serious burden on society, with the human element contributing to 98.8% of all injury accidents in 2022. This highlights the critical importance of mastering basic driving skills before taking to the road. A driver must understand that operating a vehicle is not just about moving from one place to another — it requires constant attention, proper decision-making, and full control over the vehicle at all times. The Jordanian curriculum emphasizes that driving is a privilege that comes with significant responsibility toward oneself, passengers, pedestrians, and other road users."
},
{
"title": "Understanding Vehicle Safety Systems",
"content": "Every vehicle is equipped with safety systems designed to protect the driver and passengers. These systems include active safety systems (such as brakes, steering, and suspension) that help prevent accidents, and passive safety systems (such as seat belts, airbags, and crumple zones) that protect occupants during a collision. A responsible driver must be familiar with all safety systems in their vehicle, know how they function, and ensure they are always in proper working condition. Before driving, you should check that all warning lights on the dashboard are functioning properly and that no safety system is compromised. The vehicle's technical readiness is a prerequisite for safe driving."
},
{
"title": "Pre-Driving Vehicle Inspection",
"content": "Before starting any journey, a driver must perform a thorough pre-driving inspection. This includes checking the exterior of the vehicle for any visible damage, ensuring all tires are properly inflated and have adequate tread depth, checking that all lights (headlights, taillights, brake lights, turn signals) are functioning, and verifying that the windshield and windows are clean for maximum visibility. The driver should also check fluid levels (engine oil, coolant, brake fluid, windshield washer fluid) and ensure there are no leaks underneath the vehicle. Inside the cabin, the driver must adjust the seat, mirrors, and steering wheel to ensure proper driving posture and visibility. This routine inspection helps identify potential problems before they become dangerous on the road."
},
{
"title": "Proper Seating Position and Posture",
"content": "A correct seating position is essential for maintaining full control of the vehicle. The driver's seat should be adjusted so that when the pedals are fully pressed, the legs remain slightly bent at the knees. The back should be firmly against the seatback, and the arms should be slightly bent when holding the steering wheel at the 9 o'clock and 3 o'clock positions. The headrest should be positioned so that its center aligns with the top of the driver's ears to prevent whiplash in case of a rear-end collision. The driver should sit high enough to have a clear view of the road and instruments without obstruction. Proper posture reduces fatigue during long drives and allows for quicker reactions in emergency situations."
},
{
"title": "Understanding and Using the Steering Wheel",
"content": "The steering wheel is the primary control for directing the vehicle. The recommended hand position is at 9 o'clock and 3 o'clock, which provides the best balance of control and comfort. For turns, the push-pull method is recommended: one hand pushes the wheel up while the other pulls it down, allowing for smooth and controlled turning without crossing hands. The driver should never wrap their thumbs inside the steering wheel, as a sudden jolt could cause injury. When straightening the wheel after a turn, allow the wheel to return naturally while maintaining contact. Oversteering or sudden jerky movements can lead to loss of control, especially at higher speeds. Always keep both hands on the wheel except when operating other controls."
},
{
"title": "Mastering the Pedals: Accelerator, Brake, and Clutch",
"content": "Understanding the proper use of pedals is fundamental to smooth and safe driving. The accelerator (gas pedal) should be pressed gently and gradually to increase speed smoothly. Sudden acceleration wastes fuel and can be dangerous. The brake pedal should be pressed progressively — starting gently and increasing pressure as needed — to bring the vehicle to a smooth stop. Sudden braking can cause skidding or rear-end collisions. For manual transmission vehicles, the clutch pedal must be pressed fully to the floor before changing gears, and released gradually to engage the gear smoothly without stalling. The left foot should never be used for braking in automatic vehicles unless specifically trained for left-foot braking techniques. Heel-and-toe technique may be used in advanced driving for smooth downshifting."
},
{
"title": "Using the Gear System Effectively",
"content": "Proper gear selection is crucial for vehicle control and fuel efficiency. In automatic transmissions, the driver should understand when to use Drive (D), Reverse (R), Neutral (N), and Park (P). Some automatic vehicles also offer manual mode or lower gear options (L, 2, 1) for descending steep hills or towing. In manual transmissions, the driver must learn to select the appropriate gear for the speed and road conditions. First gear is for starting from a stop, second for low-speed maneuvering, third for moderate speeds, fourth for higher speeds, and fifth (or sixth) for cruising on highways. When approaching a steep descent, the driver should shift to a lower gear before starting the descent rather than relying solely on brakes, which can overheat and fail. The Jordanian curriculum specifically mentions using reverse gears on steep descents when necessary."
},
{
"title": "Understanding and Using Mirrors",
"content": "Mirrors are essential for situational awareness while driving. The vehicle typically has three mirrors: the interior rearview mirror and two exterior side mirrors. The interior mirror should provide a view of the entire rear window. The side mirrors should be adjusted so that the vehicle's body is barely visible (about 10% of the mirror surface) and the rest shows the adjacent lanes. A common technique is to lean your head toward the mirror when adjusting it — when your head touches the window, adjust the left mirror; when your head is at the center of the vehicle, adjust the right mirror. Mirrors should be checked every 5-8 seconds while driving and before any lane change, turn, or braking maneuver. However, mirrors alone are not sufficient — the driver must also perform shoulder checks (blind spot checks) before changing lanes, as mirrors cannot cover all angles."
},
{
"title": "Using Turn Signals Correctly",
"content": "Turn signals are the primary means of communicating your intentions to other road users. They must be activated before any lane change, turn, merge, or exit from a roundabout. In Jordan, the law requires that turn signals be used in advance of any maneuver — typically at least 30 meters before the turn in urban areas and 100 meters or more on highways. The signal should remain active until the maneuver is complete. Failing to use turn signals is one of the major causes of traffic accidents in Jordan, contributing significantly to lane violation accidents which represent 40.3% of all injury accidents. After completing a turn, ensure the signal has cancelled automatically or cancel it manually. Using turn signals is not optional — it is a legal requirement and a critical safety practice."
},
{
"title": "Using Headlights and Vehicle Lights",
"content": "Vehicle lights serve multiple purposes: illumination, signaling, and increasing visibility. Headlights must be used from sunset to sunrise, during fog, rain, dust storms, or any conditions that reduce visibility. Low beams should be used in normal conditions and when approaching other vehicles. High beams should only be used on dark roads with no oncoming traffic, and must be switched to low beams when another vehicle is within 200 meters. Fog lights should be used in foggy conditions along with low beams. Daytime running lights improve visibility during the day. Brake lights activate automatically when the brake pedal is pressed, warning following drivers. Hazard lights (four-way flashers) should be used when the vehicle is stopped in a dangerous position, during emergencies, or when driving significantly below the speed of traffic. All lights must be checked regularly and replaced immediately if faulty."
},
{
"title": "Understanding Lane Usage and Lane Discipline",
"content": "Proper lane usage is a fundamental skill for safe driving. On multi-lane roads, the rightmost lane is generally the driving lane, and the left lanes are for overtaking. After completing an overtaking maneuver, the driver must return to the right lane as soon as it is safe to do so. In Jordan, failure to follow proper lane discipline is the leading cause of injury accidents at 40.3%. A driver should stay in their lane at all times and avoid unnecessary lane changes. When changing lanes, the driver must first check mirrors, perform a shoulder check for blind spots, activate the turn signal, and then smoothly transition to the new lane. On roundabouts, the driver must stay in the appropriate lane based on their intended exit. Lane discipline also includes not straddling lane markings and not driving on the shoulder unless necessary for emergencies or as permitted by law."
},
{
"title": "Entering and Exiting the Roadway",
"content": "Entering and exiting a roadway requires careful judgment and proper technique. When entering a road from a side street or driveway, the driver must come to a complete stop, check for traffic in both directions, and wait for a safe gap before proceeding. When entering a highway or freeway, the driver must use the acceleration lane to match the speed of traffic before merging — never stop in the acceleration lane unless absolutely necessary. When exiting, the driver should move to the appropriate exit lane well in advance, reduce speed gradually in the deceleration lane, and not slow down on the main roadway. The Jordanian curriculum notes that priority signs are placed at the entrance of auxiliary lanes for right turns where there is insufficient distance for acceleration, indicating the need for special caution at these locations."
},
{
"title": "Overtaking Procedures and Rules",
"content": "Overtaking (passing) is one of the most dangerous maneuvers in driving and must be performed with extreme caution. Before overtaking, the driver must ensure that there is sufficient visibility ahead, no oncoming traffic, and enough space to complete the maneuver safely. The steps for overtaking are: (1) Check mirrors and blind spots, (2) Signal your intention, (3) Move to the overtaking lane while accelerating smoothly, (4) Pass the vehicle with adequate clearance, (5) Signal before returning to the original lane, (6) Return to the lane only when the overtaken vehicle is fully visible in the interior mirror. Overtaking is prohibited on curves, hilltops, intersections, pedestrian crossings, railway crossings, in areas with solid center lines, and when visibility is insufficient. In Jordan, trucks weighing more than 3.5 tons are additionally prohibited from overtaking on certain roads to avoid the increased risk associated with their longer braking distances and larger blind spots."
},
{
"title": "Meeting Oncoming Vehicles on Narrow Roads",
"content": "On narrow roads where two vehicles cannot pass simultaneously, special rules apply. When a road is too narrow for two vehicles, the driver must identify who has priority. If there is a priority sign indicating priority for oncoming traffic, the driver must wait on their side until the oncoming vehicle passes. If there is a sign giving priority to the entering vehicle, the driver may proceed. When no signs are present, the general rule is that the vehicle going uphill typically has priority, and the vehicle going downhill should pull over to let it pass. The driver should slow down, pull as far to the right as possible, and stop if necessary to allow the oncoming vehicle to pass safely. Never force your way through a narrow section — patience and courtesy prevent accidents and save lives."
},
{
"title": "Driving on Different Road Types",
"content": "Different road types require different driving techniques. Urban roads demand lower speeds, constant awareness of pedestrians, cyclists, and parked vehicles, and frequent stops. Rural roads may have higher speeds but present hazards such as animals, farm vehicles, and sharp curves. Highways and freeways require higher-speed driving skills, proper lane discipline, longer following distances, and awareness of merging and exiting traffic. Mountain roads demand careful use of gears for descent, awareness of steep grades, and caution at curves with limited visibility. The Jordanian curriculum notes that the lack of road classification (whether a road is primary, secondary, or local) is one factor contributing to accidents, as drivers may not adjust their speed and behavior appropriately for the road type they are on."
},
{
"title": "Driving in Adverse Weather Conditions",
"content": "Adverse weather significantly increases driving risk. In rain, the road surface becomes slippery, especially during the first 30 minutes of rainfall when oil and dust mix with water. The driver should reduce speed, increase following distance, and avoid sudden braking or steering. In fog, the driver should use low beam headlights and fog lights, reduce speed significantly, and follow the right edge of the road as a guide. In snow and ice, the vehicle's traction is greatly reduced, requiring very gentle acceleration, braking, and steering. The Jordanian curriculum includes warning signs for slippery roads, falling rocks, strong winds, and low-flying aircraft areas — all indicating conditions requiring special driving techniques. The general rule in adverse weather is: reduce speed, increase following distance, and increase alertness."
},
{
"title": "Night Driving Skills",
"content": "Night driving presents unique challenges due to reduced visibility. The driver should ensure all headlights, taillights, and interior lights are functioning properly. Headlights should be switched on at least 30 minutes before sunset. When using high beams, switch to low beams when approaching another vehicle within 200 meters to avoid blinding the other driver. The driver should look slightly to the right edge of the road when facing oncoming high beams to avoid being temporarily blinded. Speed should be reduced at night because visibility is limited to the distance illuminated by the headlights. Fatigue is more common at night, so the driver should take regular breaks. The Jordanian curriculum emphasizes that all signs must be clearly visible both day and night, and drivers must be able to recognize and respond to signs in darkness."
},
{
"title": "Driving Through Intersections Safely",
"content": "Intersections are high-risk locations where multiple traffic flows converge. When approaching an intersection, the driver must reduce speed, check for traffic signals or signs, scan all directions for potential hazards, and be prepared to stop. At uncontrolled intersections, the general rule is to give priority to the vehicle approaching from the right. At roundabouts, vehicles inside the roundabout have priority over those entering. The driver must never enter an intersection unless there is sufficient space to clear it completely — blocking an intersection is dangerous and illegal. Special attention must be paid to pedestrians and cyclists at intersections. In Jordan, intersection-related accidents are common, and the curriculum stresses the importance of understanding and following priority rules at every type of intersection."
},
{
"title": "Driving Near Pedestrians and Vulnerable Road Users",
"content": "Pedestrians are the most vulnerable road users. In Jordan, pedestrians account for 25.4% of all traffic injuries and 36.1% of all traffic fatalities — the highest fatality rate by position. When driving near pedestrians, the driver must reduce speed to 30 km/h in areas where pedestrians are present, especially near schools, markets, and residential areas. The driver must give priority to pedestrians at marked crossings and be prepared to stop at any time a pedestrian appears to be about to cross. Special attention must be paid to children, elderly persons, and persons with disabilities who may have slower reaction times or unpredictable movements. Cyclists and motorcyclists are also vulnerable and should be given adequate space when passing — at least 1 meter in urban areas and more on highways."
},
{
"title": "Parking Skills and Rules",
"content": "Parking is an essential driving skill that requires practice and awareness. The driver must only park in designated areas and must obey all parking and standing prohibition signs. Blue signs with a red border indicate parking or standing restrictions. When parallel parking, the driver should position the vehicle alongside the space, reverse slowly while turning the wheel toward the curb, then straighten the wheels. The vehicle should be parked within 30 cm of the curb and not block traffic or other vehicles. On hills, the wheels should be turned toward the curb when facing downhill and away from the curb when facing uphill (or toward the curb when facing uphill with no curb). The handbrake should always be engaged. Parking is prohibited in front of fire hydrants, bus stops, intersections, crosswalks, and on sidewalks."
},
{
"title": "Handling Vehicle Emergencies",
"content": "Every driver must know how to handle common vehicle emergencies. In case of brake failure, the driver should downshift to lower gears, use the handbrake gradually, and steer toward a safe area. In case of a tire blowout, the driver should grip the steering wheel firmly, avoid sudden braking, and gradually reduce speed while steering straight. In case of engine failure, the driver should activate hazard lights, steer to the side of the road, and stop in a safe location. In case of an electrical fire, the driver should turn off the ignition, evacuate all passengers, and use a fire extinguisher if available. The Jordanian curriculum emphasizes that proper vehicle maintenance and pre-trip inspections can prevent most emergencies. However, being prepared and knowing the correct response can save lives when emergencies do occur."
},
{
"title": "Defensive Driving Principles",
"content": "Defensive driving is the practice of anticipating dangerous situations despite the actions of others or adverse conditions. Key principles include: always maintain a safe following distance, scan the road ahead for potential hazards, expect other drivers to make mistakes, never assume other drivers have seen you, adjust speed for conditions, and always have an escape route planned. In Jordan, the human factor is responsible for 98.8% of injury accidents, which means defensive driving is the single most important skill for avoiding accidents. Defensive driving also includes avoiding aggressive driving behaviors, managing emotions, and not engaging with aggressive drivers. The goal is to arrive safely, not quickly."
},
{
"title": "Avoiding Driver Fatigue and Distraction",
"content": "Driver fatigue and distraction are major contributors to traffic accidents. Fatigue reduces reaction time, impairs judgment, and can lead to falling asleep at the wheel. Signs of fatigue include yawning, heavy eyelids, difficulty concentrating, and drifting between lanes. To combat fatigue, the driver should take a break every 2 hours, avoid driving during the body's natural sleep hours (midnight to 6 AM), and never drive after consuming alcohol or medications that cause drowsiness. Distraction includes using mobile phones, eating, adjusting the radio, or any activity that takes the driver's attention off the road. In Jordan, not paying attention while driving is a contributing factor to accidents. The rule is simple: when driving, the only task should be driving."
},
{
"title": "Understanding Vehicle Dimensions and Limitations",
"content": "A skilled driver must understand their vehicle's dimensions and limitations. This includes knowing the vehicle's width, height, length, and weight, as well as its turning radius, braking distance, and acceleration capability. These factors affect how the vehicle navigates narrow roads, low bridges, sharp turns, and steep grades. The Jordanian curriculum includes prohibition signs for vehicles exceeding certain dimensions (width over 2.2m, height over 3.5m, length over 12m) and weight limits (total weight over 12 tons, axle weight over 8 tons). Drivers of large vehicles must be especially aware of their blind spots, longer stopping distances, and wider turning radius. Understanding your vehicle's limitations helps you make safe decisions on the road."
},
{
"title": "Driving Near Railway Crossings",
"content": "Railway crossings require special attention and caution. When approaching a railway crossing with gates or barriers, the driver must stop when the gates begin to lower or when lights are flashing. At crossings without gates, the driver must slow down, look both ways, listen for approaching trains, and only proceed when it is safe. If a stop sign is present at a railway crossing, the driver must come to a complete stop before the crossing. The Jordanian curriculum includes multiple warning signs for railway crossings: crossings with gates, crossings without gates, multiple tracks at different distances, single track crossings, and multiple track crossings. The general rule is: never try to beat a train at a crossing. Trains cannot stop quickly, and the consequences of a collision are almost always fatal."
},
{
"title": "Driving Through Tunnels",
"content": "Tunnels present unique driving challenges including reduced visibility, confined space, and potential changes in road surface conditions. The Jordanian curriculum includes a warning sign for tunnels, instructing drivers to reduce speed to 50 km/h, stay in their lane, and not overtake inside the tunnel. Before entering a tunnel, the driver should remove sunglasses, turn on headlights, and check that the vehicle's height and width are within the tunnel's limits. Inside the tunnel, the driver should maintain a safe following distance, avoid changing lanes, and be prepared for sudden traffic stops. If the vehicle breaks down in a tunnel, the driver should try to coast to the nearest exit, turn on hazard lights, and call for help immediately. Never stop inside a tunnel unless absolutely necessary."
},
{
"title": "Driving in Work Zones",
"content": "Work zones (construction zones) on roads require heightened awareness and reduced speed. The Jordanian curriculum includes a warning sign for road works, instructing drivers to reduce speed, follow the designated lane, exercise caution while driving through the work zone, and give priority to vehicles that have the right of way in the work zone. Work zones often have narrowed lanes, temporary barriers, workers on or near the road, and heavy machinery entering and exiting. Speed limits in work zones are typically lower than normal, and fines for speeding in work zones are often doubled. The driver should pay attention to temporary signs, flaggers, and any changed traffic patterns. Patience is essential — work zones are temporary, but accidents in them can be permanent."
},
{
"title": "Environmental Awareness and Eco-Driving",
"content": "Responsible driving includes being aware of the environmental impact of driving. Eco-driving techniques include maintaining steady speeds, avoiding unnecessary acceleration and braking, shifting to higher gears early, maintaining proper tire pressure, avoiding excessive idling, and planning routes to avoid congestion. These techniques not only reduce fuel consumption and emissions but also improve safety. The Jordanian curriculum notes that traffic accidents have environmental impacts including damage to road infrastructure, effects on soil, animal life, vegetation, air quality, and public health. By driving responsibly, a driver contributes to both road safety and environmental protection. The curriculum also encourages the use of public transportation to reduce the number of vehicles on the road."
},
{
"title": "The Importance of Continuous Learning",
"content": "Driving is a skill that requires continuous improvement and learning. Even after obtaining a license, a driver should stay updated on traffic laws and regulations, participate in refresher courses, and learn from experienced drivers. The Jordanian curriculum emphasizes the importance of proper training, noting that controlling driver training centers and verifying the effectiveness of their training programs is one of the key strategies for reducing traffic accidents. New drivers, especially those in the 18-35 age group (who represent 45.9% of all injured persons and 42.7% of all drivers involved in injury accidents relative to registered drivers in the same age group), should be particularly aware of their limitations and seek additional training and supervision during their first years of driving."
}
]
},
{
"title": "Traffic Signs",
"description": "Complete and detailed guide to all traffic signs in Jordan including warning signs, regulatory signs, prohibition signs, mandatory signs, parking signs, guide signs, and tourist signs, along with their design specifications, placement rules, and usage conditions.",
"image": "",
"order": 2,
"isPublished": true,
"lessons": [
{
"title": "Introduction to Traffic Signs in Jordan",
"content": "Traffic signs are metal plates with specific shapes, colors, and sizes designed to regulate traffic, warn drivers, and guide road users. In Jordan, the first guide for road and street signs was issued by the Ministry of Public Works and Housing in 1962, and in 2003, the Traffic Signs Guide, Road Markings Guide, and Work Zone Signs Guide were issued by a decision of the Prime Minister. These guides became mandatory for all ministries involved in manufacturing and installing traffic signs. Internationally, the Vienna Convention of 1968 established a unified system for traffic signs that Jordan follows. The purpose of traffic signs is to organize traffic flow, warn drivers of hazards, provide guidance, and ultimately reduce accidents. Any assault on traffic signs — whether by placing posters on them or damaging them — is considered unethical and leads to negative consequences including traffic accidents."
},
{
"title": "Classification of Traffic Signs",
"content": "Traffic signs in Jordan are classified into three main categories based on their function: (1) Warning Signs — which warn road users of dangers ahead that may cause harm; (2) Traffic Regulation Signs — which inform road users of their rights and obligations under traffic laws, and are further divided into priority signs, prohibition signs, parking and standing signs, and mandatory signs; and (3) Guide Signs — which provide road users with information that may be useful during their journey, including lane designation signs, directional signs, location signs, service signs, and any other signs providing useful information. Each category has a distinct shape and color scheme to make identification quick and intuitive, even at speed or in poor visibility conditions."
},
{
"title": "Understanding Sign Shapes and Colors",
"content": "The shape and color of a traffic sign communicate its category before the driver can read the text or symbol. Warning signs are equilateral triangles with a white background, red border, and black symbols/text. Regulatory prohibition signs are circular with a white background, red border, and black symbols/text. Parking and standing prohibition signs are circular with a blue background and red border. Mandatory signs are circular with a blue background and white symbols/text. Guide signs are rectangular (square or oblong) with a blue background and white text/symbols. Tourist signs have a brown background with white text/symbols. This color-coding system allows drivers to instantly recognize the type of sign and react appropriately, even from a distance or in low-light conditions."
},
{
"title": "Traffic Sign Dimensions and Sizes",
"content": "Traffic signs in Jordan come in three standard sizes: small, normal, and large. Warning signs (triangle side length): small = 600mm, normal = 900mm, large = 1350mm. Regulatory signs (circle diameter): small = 400mm, normal = 600mm, large = 900mm. Guide signs (width × height): small = not specified, normal = 600×600mm, large = 900×900mm. Large signs are used on main expressways, on divided roads with two or more lanes per direction where the speed limit exceeds 80 km/h, and on any road that requires emphasis on mandatory or guide information. Normal-sized signs are used in all other cases. Small signs are used in special locations where normal signs would be inappropriate, in narrow urban streets, and where speed limits are low. Additionally, stop signs are normally 900mm tall, but larger sizes up to 1200mm may be used, or smaller 600mm signs in special cases."
},
{
"title": "Sign Placement and Installation Rules",
"content": "Proper placement of traffic signs is critical for their effectiveness. Signs must be placed on the side of the road in the direction of traffic flow, positioned so they are clearly visible and give the road user a good impression at the required time. For roads outside urban areas, signs are installed at specific heights and lateral distances from the road edge. For large directional signs outside urban areas, different height and distance standards apply. When a road has a pedestrian sidewalk and the sign can be placed outside the pedestrian path, it follows one set of specifications; when it cannot be placed outside the pedestrian path, it follows another. Signs must be positioned to avoid obstructing pedestrian movement while remaining clearly visible to drivers. The installation must ensure that the sign is upright, clean, and not obscured by vegetation, other signs, or structures."
},
{
"title": "Warning Signs: General Principles",
"content": "Warning signs alert drivers to potential dangers ahead. They are shaped as equilateral triangles with a white background, red border, and black symbols or text. The length of the triangle's side is determined based on the posted speed limit — higher speeds require larger signs for visibility from greater distances. Warning signs do not give orders; they simply inform the driver of a hazard that requires attention and often a reduction in speed. The driver should not merely acknowledge the warning sign but must take appropriate action — slow down, be alert, and avoid risky maneuvers such as overtaking in areas with limited visibility. Warning signs are placed at a sufficient distance before the hazard to give the driver adequate time to react."
},
{
"title": "Warning Sign: Right Curve",
"content": "The right curve warning sign depicts a curved arrow pointing to the right. When a driver sees this sign, they must pay attention and be cautious of a right curve ahead. The driver must reduce their vehicle's speed to match the safe speed for the curve and must not attempt to overtake, as visibility around the curve is insufficient. The sign is placed before the curve begins, giving the driver time to adjust. On roads with higher speed limits, the sign will be larger and placed further in advance. Failure to heed this warning can result in the vehicle drifting off the road or into the oncoming lane, especially for heavy vehicles or in wet conditions."
},
{
"title": "Warning Sign: Left Curve",
"content": "The left curve warning sign depicts a curved arrow pointing to the left. Similar to the right curve sign, this sign requires the driver to be attentive and cautious of a left curve ahead. The driver must reduce speed to a level appropriate for the curve and avoid overtaking because visibility is limited. Left curves can be particularly dangerous because the driver may be positioned on the outside of the curve, and centrifugal force pushes the vehicle toward the outer edge. The driver should approach the curve while already at the correct speed rather than braking in the curve, which can cause skidding. The sign is placed at an adequate distance before the curve."
},
{
"title": "Warning Signs: Successive Curves",
"content": "Two types of successive curve signs exist. The first shows curves alternating right then left, and the second shows curves alternating left then right. These signs warn the driver of multiple curves in sequence, requiring sustained attention and speed reduction throughout the entire section. The driver must reduce speed to match the speed of the curves and avoid overtaking, as visibility remains insufficient throughout the curved section. Successive curves are particularly dangerous because drivers may relax after the first curve, not expecting another. The driver should maintain a reduced speed until they have passed all the curves indicated by the sign."
},
{
"title": "Warning Signs: Steep Descent and Ascent",
"content": "The steep descent sign (showing a downward arrow with a percentage) warns the driver of a steep downhill section ahead. The driver must control their speed using engine braking (lower gears) and avoid relying solely on the brake pedal, which can overheat and fail on long descents. The Jordanian curriculum specifically mentions using reverse gears on steep descents. The steep ascent sign (showing an upward arrow) warns of a steep uphill section. The driver must manage their speed appropriately, stay in the right lane, and be aware that heavy vehicles will slow significantly on ascents, potentially creating hazards for faster vehicles approaching from behind."
},
{
"title": "Warning Signs: Road Narrowing",
"content": "Three types of road narrowing warning signs exist: narrowing from both sides, narrowing from the right, and narrowing from the left. Each sign shows the road width decreasing from the indicated direction(s). When encountering any narrowing sign, the driver must reduce speed, comply with posted speed limits, stay in the right lane, and not attempt to overtake. Narrowing from both sides is particularly dangerous because vehicles from both directions may be competing for reduced space. The driver should be prepared to stop if necessary and allow vehicles from the other direction to pass safely. Bridge narrowing signs are also included in this category, requiring the same precautions."
},
{
"title": "Warning Sign: Road Ends at Water",
"content": "This sign warns that the road being traveled ends at a sea, river, or lake edge. The driver must be extremely cautious and reduce speed to the permitted limits to be able to stop upon reaching the end of the road. This sign is critical because failing to stop could result in the vehicle entering the water, which is extremely dangerous and potentially fatal. The driver should look for additional warning signs, barriers, or end-of-road markings as they approach. This sign is typically placed at significant distance before the water's edge to give adequate stopping time."
},
{
"title": "Warning Signs: Uneven Road and Speed Bumps",
"content": "The uneven road sign warns of potholes or rough road surfaces ahead. The driver must reduce speed and proceed with caution to avoid damage to the vehicle or loss of control. The speed bump sign warns of an artificial speed bump (road hump) ahead. The driver must reduce speed to safely cross the speed bump without damaging the vehicle or losing control. Speed bumps are typically installed in residential areas, near schools, and in areas where speed reduction is needed for pedestrian safety. The driver should not brake abruptly on a speed bump but should approach it at a steady, reduced speed."
},
{
"title": "Warning Signs: Road Works and Slippery Road",
"content": "The road works sign warns of construction or maintenance work ahead. The driver must reduce speed, follow the designated lane, exercise caution while driving through the work zone, and give priority to vehicles that have the right of way in the work zone. Work zones may have temporary lane changes, reduced width, workers near the roadway, and construction equipment. The slippery road sign warns of a road section with reduced traction, which could be due to rain, ice, oil, or road surface conditions. The driver must reduce speed, stay in their lane, exercise caution, and avoid overtaking. Both signs require heightened attention and reduced speed."
},
{
"title": "Warning Signs: Falling Rocks",
"content": "Three signs relate to falling rocks: falling rocks from the right, falling rocks from the left, and scattered rocks. Falling rocks from the right/left show rocks falling from the indicated side, and the driver must proceed with caution and attention. The scattered rocks sign warns of rocks already on the roadway, requiring the driver to reduce speed, maintain a sufficient safety distance from other vehicles to avoid scattered rocks, and avoid overtaking. These signs are typically found in mountainous areas or near road cuts. The driver should not stop in the danger zone but should pass through quickly at a reduced speed while staying alert for falling debris."
},
{
"title": "Warning Signs: Pedestrian Crossing and School Zone",
"content": "The pedestrian crossing sign warns of a marked pedestrian crossing ahead. The driver must reduce speed to 30 km/h and stop at a sufficient distance before the crossing to give priority to pedestrians who are crossing or about to cross. The school zone sign warns of students (school children) ahead. The driver must reduce speed to 30 km/h and pay special attention to students, giving them priority of passage. These signs are critical for pedestrian safety — in Jordan, pedestrians represent 36.1% of all traffic fatalities, the highest among all road user categories. Drivers must always be prepared to stop at these locations, as children may dart into the road unexpectedly."
},
{
"title": "Warning Signs: Bicycle Crossing and Animal Crossing",
"content": "The bicycle crossing sign warns of a bicycle path or crossing ahead where cyclists may enter the roadway. The driver must reduce speed and give priority to bicycles. Cyclists are vulnerable road users who require extra space and caution. The animal crossing sign (showing a camel) warns of animals that may cross the road. The driver must reduce speed to be able to avoid animals on the road. The shape shown on the sign indicates the type of animals typically found in that area. In rural areas of Jordan, animal crossings can be particularly hazardous, especially at dawn and dusk when animals may be difficult to see. The driver should scan the roadside for animals and be prepared to stop."
},
{
"title": "Warning Signs: Dangerous Shoulders and Low-Flying Aircraft",
"content": "The dangerous shoulders sign warns of unsafe road shoulders or a difference in level between the shoulder and the roadway. The driver must be cautious about leaving the roadway surface, as the shoulder may be unstable or significantly lower than the road. The low-flying aircraft sign warns of an area where aircraft fly at low altitude. The driver must be attentive and take precautions, including reducing speed. This sign is typically found near airports or military airbases. While aircraft do not directly interact with road traffic, low-flying aircraft can startle drivers, cause noise distraction, and in rare cases, debris from aircraft could pose a hazard."
},
{
"title": "Warning Signs: Strong Wind",
"content": "Two strong wind warning signs exist: strong wind from the left and strong wind from the right. These signs warn of crosswinds that can affect vehicle stability, especially for high-profile vehicles (trucks, buses, vans) and motorcycles. The driver must drive with attention, comply with posted speed limits, and stay in the right lane. Crosswinds can push a vehicle out of its lane, particularly when exiting a sheltered area such as a tunnel or bridge. The driver should grip the steering wheel firmly and be prepared for sudden gusts. Reduction of speed is the most effective countermeasure against wind effects."
},
{
"title": "Warning Signs: Two-Way Traffic and Divided Road",
"content": "The two-way traffic sign warns that the road ahead carries traffic in both directions. The driver must be cautious and stay on the right side of the road. This sign is typically placed after a one-way section or where a road transitions from divided to undivided. The divided road ahead sign warns that the road is about to have a central island separating opposing traffic. The end of divided road sign warns that the central island is ending and the road will no longer be divided. When approaching the end of a divided road, the driver must be cautious and stay in the right lane, as oncoming traffic will no longer be separated by a physical barrier."
},
{
"title": "Warning Signs: Tunnel",
"content": "The tunnel warning sign alerts the driver to an upcoming tunnel. The driver must reduce speed to 50 km/h, stay in their lane, and not overtake inside the tunnel. Before entering, the driver should ensure their vehicle's width and height are compatible with the tunnel dimensions. Inside the tunnel, the driver should maintain a safe following distance and be prepared for possible traffic congestion. The Jordanian curriculum specifically mentions checking that the vehicle's width and height are appropriate for the tunnel. If the vehicle breaks down inside a tunnel, the driver should attempt to coast to the nearest exit rather than stopping inside."
},
{
"title": "Warning Signs: Railway Crossings",
"content": "Five types of railway crossing warning signs exist: (1) Railway crossing with gates/barriers — stop and wait for gates to open; (2) Railway crossing without gates — reduce speed and be prepared to stop; (3) Railway crossings at different distances — indicates multiple tracks at varying distances from the crossing; (4) Single-track railway crossing — one set of tracks; (5) Multiple-track railway crossing — more than one set of tracks. For all railway crossings, the driver must slow down, look both ways, listen for trains, and give absolute priority to trains. Trains always have priority and cannot stop quickly. A stop sign at a railway crossing requires a complete stop before the tracks."
},
{
"title": "Warning Signs: Intersections",
"content": "Several intersection warning signs exist: general intersection, main road with two secondary roads, main road with one secondary road (from left), main road with one secondary road (from right), roundabout ahead, stop sign ahead, and give priority sign ahead. At intersections, the driver must reduce speed, follow priority rules, and give right of way as required. The roundabout sign requires reducing speed and giving priority to vehicles already inside the roundabout. The stop sign ahead and give priority sign ahead are advance warnings that prepare the driver for the regulatory signs they are about to encounter. These advance warnings are particularly important when visibility or speed conditions make it difficult to see the actual regulatory sign in time."
},
{
"title": "Warning Signs: Miscellaneous Dangers",
"content": "The miscellaneous dangers sign (triangle with an exclamation mark) warns of hazards that do not have a specific symbol. These can include fog, dust storms (known locally as 'Toz'), floods, road endings, landslides, or other unusual dangers. The driver must take appropriate precautions based on the specific type of danger present. This sign is a catch-all for situations where a specific symbol has not been designed but the hazard is significant enough to warrant a warning. The driver should slow down, increase alertness, and proceed with extreme caution until the nature of the hazard is understood and safely passed."
},
{
"title": "Supplementary Warning Devices: Text Signs",
"content": "In addition to symbolic warning signs, text warning signs are used to warn of hazards that do not have specific symbols. These signs use brief written words instead of pictorial symbols. The most common example is the 'reduce speed' sign, which explicitly instructs the driver to slow down. Text signs must use concise language that can be read quickly at the posted speed limit. They are used when a symbol would be unclear or insufficient to convey the specific nature of the hazard. Text signs follow the same placement and sizing rules as other warning signs."
},
{
"title": "Supplementary Warning Devices: Chevron Markers and Barrier Markers",
"content": "Chevron markers (strip markers) are placed at sharp curves to improve visibility and guide the driver through the curve. They typically consist of alternating red and white diagonal stripes on a rectangular panel. Single strip markers may be used for mild curves, while three-strip markers indicate sharper curves requiring more caution. Barrier markers (side barrier markings) are used to define points where the road narrows and visibility is unclear. They help drivers understand the road alignment and identify the road edge in conditions of reduced visibility. Both types of markers are supplementary devices that work alongside warning signs to provide additional guidance in hazardous locations."
},
{
"title": "Priority Signs: Give Priority (Yield)",
"content": "The give priority (yield) sign is an inverted triangle with a white background and red border. When a driver sees this sign, they must reduce speed before reaching the intersection and give priority to other vehicles on the intersecting road. The driver does not need to come to a complete stop if the road is clear, but must always be prepared to stop if necessary. This sign is used at intersections where a secondary road meets a main road, at entrances to expressways, and at the beginning of auxiliary lanes for right turns where there is insufficient acceleration distance. A warning sign must be placed in advance when visibility is less than 150 meters (for speeds up to 80 km/h) or 200 meters (for speeds above 80 km/h)."
},
{
"title": "Priority Sign: Stop",
"content": "The stop sign is an octagon (eight-sided) with a red background, white border, and the word 'STOP' in white in both Arabic and English. When a driver encounters a stop sign, they must come to a complete stop before entering the intersection, and must not proceed until they have verified that there are no vehicles coming from other directions. This sign is also used at railway crossings without gates. The stop sign is placed at a distance not exceeding 25 meters from the nearest edge of the main road. On roads with two or more lanes in one direction, or at intersections designed for two or more vehicles side by side, or when visibility is insufficient, an additional stop sign may be placed on the left side of the road. A warning sign must be placed in advance when visibility is less than 150m (speeds up to 80 km/h) or 200m (speeds above 80 km/h)."
},
{
"title": "Priority Sign: Road with Priority",
"content": "The road with priority sign is a yellow diamond with a white border. It indicates that the road the driver is on has priority over intersecting roads. The driver should continue driving with caution and at the posted speed limit without needing to stop at intersections, as other roads entering this road will have yield or stop signs. This sign is installed at the beginning of a priority road and repeated after each intersection. In Jordan, this sign is used only when necessary based on engineering studies. When two priority roads intersect, a stop or yield sign must be installed for one of them. A warning sign must be placed before any yield or stop sign on the priority road to prevent confusion."
},
{
"title": "Priority Signs: Priority for Oncoming and Entering Traffic",
"content": "Two signs deal with priority on narrow road sections. The priority for oncoming traffic sign (red arrow pointing up) is placed facing the direction that must yield. It tells the driver to reduce speed, yield to the oncoming vehicle, and not proceed until the oncoming vehicle has passed, because the road is too narrow for both vehicles to pass simultaneously. The priority for entering traffic sign (blue square with white arrow up and red arrow down) gives priority to the vehicle entering the narrow section. The driver facing this sign has the right to proceed through the narrow section, and the oncoming vehicle must wait. The red arrow always points downward on this sign. These signs must be placed so that the entire narrow section is clearly visible to the driver who must yield."
},
{
"title": "Prohibition Signs: General Principles",
"content": "Prohibition signs are circular with a white background, red border, and black symbols or text. They inform road users of activities or vehicle types that are prohibited. The red circle with a diagonal line is the universal symbol for prohibition. These signs are regulatory — violating them is a traffic offense that can result in fines, penalty points, or vehicle impoundment. Prohibition signs apply from the point where they are placed until cancelled by an end of prohibition sign or until the next intersection (unless otherwise indicated). Drivers must be able to recognize and understand all prohibition signs to avoid violations and maintain road safety."
},
{
"title": "Prohibition Signs: Vehicle Type Restrictions",
"content": "Multiple prohibition signs restrict specific vehicle types: no vehicles in both directions (road reserved for pedestrians), no entry (one-way road, entry prohibited from this direction), no motor vehicles, no motorcycles, no bicycles, no mopeds (small engine bicycles), no goods vehicles, no tractor-trailers and semi-trailers, no trailers, no pedestrians, no animal-drawn carts, no hand carts, no agricultural vehicles. Each sign clearly depicts the prohibited vehicle type. These restrictions are typically imposed to reduce congestion, noise, pollution, or danger in specific areas such as residential neighborhoods, historic areas, or roads with specific characteristics. Drivers of prohibited vehicles must find alternative routes."
},
{
"title": "Prohibition Signs: Dimension and Weight Limits",
"content": "Several prohibition signs restrict vehicles based on dimensions or weight: no vehicles wider than the specified measurement (default 2.2m), no vehicles taller than the specified measurement (default 3.5m — used where bridges or overhead obstacles limit clearance), no vehicles with total weight exceeding the specified amount (default 12 tons — used where the road or bridge cannot support heavier loads), no vehicles with axle weight exceeding the specified amount (default 8 tons per axle), and no vehicles or combinations longer than the specified measurement (default 12m). Drivers must know their vehicle's dimensions and weight to avoid entering restricted roads. Entering a road where the vehicle exceeds limits can damage the road, bridges, or overhead structures and create safety hazards."
},
{
"title": "Prohibition Signs: Maneuver Restrictions",
"content": "Several prohibition signs restrict specific driving maneuvers: no left turn, no right turn, no U-turn, no overtaking, no overtaking by trucks (for trucks over 3.5 tons). Each sign clearly depicts the prohibited maneuver. No left/right turn signs are used at intersections where turning would disrupt traffic flow or create hazards, and the road being turned onto is typically one-way. No U-turn signs are used where there is insufficient space or visibility for U-turns, or where U-turns would create danger. The no overtaking sign is used on curves, hilltops, or areas with insufficient visibility — however, it permits overtaking of motorcycles. End of prohibition signs (for overtaking, truck overtaking, and general prohibition) indicate that the restricted zone has ended."
},
{
"title": "Prohibition Signs: Speed Limit Signs",
"content": "The maximum speed sign (red circle with black number) sets the maximum permissible speed for that section of road. The maximum speed for trucks and small buses sign sets a lower speed limit for these vehicle types, reflecting their longer stopping distances and reduced maneuverability. The end of speed limit sign indicates that the posted speed limit has ended, and the driver must follow the general speed limits for that type of road or follow subsequent speed limit signs. Speed limits are not suggestions — they are legal requirements based on road design, traffic density, and safety considerations. Exceeding the speed limit is one of the major causes of traffic accidents in Jordan."
},
{
"title": "Prohibition Signs: Horn and Customs Restrictions",
"content": "The no horn sign prohibits the use of the horn (klaxon) in the area where it is posted. This restriction is typically applied near hospitals, schools, residential areas, or other locations where noise would cause disturbance. The no passing without stopping (customs) sign requires the driver to come to a complete stop at a customs checkpoint, where the vehicle will be inspected before the driver is allowed to continue. This sign is found at border crossings and customs checkpoints. Violating either of these signs can result in fines and legal consequences."
},
{
"title": "Parking and Standing Signs: Principles",
"content": "Parking and standing signs are circular with a blue background and red border. Two types exist: no parking and no parking/no standing. The no parking sign prohibits stopping except for the purpose of loading and unloading passengers or goods — this means brief stops are allowed for pickup/dropoff but the driver cannot leave the vehicle parked. The no parking/no standing sign prohibits both parking and stopping entirely, as stopping would obstruct traffic flow. These signs are critical for maintaining traffic flow in congested urban areas and ensuring access for emergency vehicles, public transportation, and other road users."
},
{
"title": "Mandatory Signs: General Principles",
"content": "Mandatory signs are circular with a blue background and white symbols or text. They command road users to follow specific directions or use specific facilities. Unlike prohibition signs which tell you what NOT to do, mandatory signs tell you what you MUST do. The blue background distinguishes them from prohibition signs (white background) at a glance. Mandatory signs include direction commands (turn left, turn right, go straight, roundabout), lane usage requirements (bicycle lane, pedestrian path, horse path), and minimum speed requirements. Violating a mandatory sign is a traffic offense. These signs are essential for organizing traffic flow at complex intersections and on multi-use roads."
},
{
"title": "Mandatory Signs: Directional Commands",
"content": "Multiple mandatory signs specify the direction a driver must take: mandatory left direction, mandatory right direction, mandatory right turn, mandatory left turn, mandatory straight ahead, mandatory roundabout (circular), mandatory ahead or left, mandatory ahead or right, mandatory right or left turn, mandatory right side, mandatory left side, mandatory right or left side. The roundabout sign commands the driver to follow the circular path of the roundabout. When multiple directions are shown on one sign, the driver may choose any of the indicated directions but must follow one of them. These signs are typically placed at intersections where only certain movements are permitted to maintain traffic flow and safety."
},
{
"title": "Mandatory Signs: Dedicated Lanes and Paths",
"content": "Several mandatory signs designate specific lanes or paths for specific users: mandatory bicycle lane (cyclists must use this path, drivers must not), mandatory pedestrian path (pedestrians must use this path, drivers must not), mandatory horse path (horse riders must use this path, drivers must not). These signs are typically found on shared-use roads or paths where different types of road users are separated. Drivers must never enter a lane or path designated for other users. Conversely, the designated users should use these facilities for their own safety. These signs work in conjunction with road markings to clearly delineate the separation between different types of traffic."
},
{
"title": "Guide Signs: General Principles",
"content": "Guide signs are rectangular (square or oblong) with a blue background and white text/symbols. They provide information that helps road users navigate to their destination. Guide signs include: direction signs showing distances to cities or areas, road number signs (primary and secondary route numbers), lane designation signs showing which lanes go to which destinations, signs indicating the beginning and end of expressways, signs showing lane additions or reductions, and service signs indicating the location of facilities such as gas stations, restaurants, hotels, hospitals, mosques, repair workshops, phones, rest areas, and parking areas. Guide signs must be clearly visible, properly positioned, and contain accurate information."
},
{
"title": "Guide Signs: Direction and Distance Information",
"content": "Direction signs show the names of cities, towns, or areas and the direction to reach them. They may show one destination with an arrow indicating the direction, or multiple destinations with arrows showing different directions. Distance signs indicate how far a destination is from the current location. Road number signs identify primary and secondary routes by number, helping drivers follow a specific route. These signs are essential for navigation, especially for drivers unfamiliar with the area. They are typically placed at intersections, highway entrances, and at regular intervals along major routes to confirm the driver is on the correct road."
},
{
"title": "Guide Signs: Expressway Signs",
"content": "The beginning of expressway sign marks the point where a road becomes an expressway with its specific rules (higher speeds, no pedestrians, no stopping, no reversing, no U-turns). The end of expressway sign marks where expressway rules no longer apply and normal road rules resume. Additional signs indicate features such as extra lanes for specific directions, lanes prohibited for trucks, and lane reductions. The Jordanian curriculum shows signs indicating an additional left lane ahead with the right lane prohibited for trucks, and signs showing lane reductions from two lanes per direction to one lane per direction. Drivers must understand these signs to navigate expressway interchanges safely."
},
{
"title": "Guide Signs: Service and Facility Signs",
"content": "Service signs indicate the availability of specific facilities along the road. These include: gas station (fuel), cafe, restaurant, hotel, airport, rest area, parking area, caravan parking, youth hostel, parking for persons with disabilities, first aid center, hospital, mosque, repair workshop, telephone, dead end (no through road), one-way road, and pedestrian crossing. Each sign uses a universally recognized symbol to ensure it can be understood regardless of language. These signs help drivers plan stops for fuel, food, rest, or emergencies. The disability parking sign indicates spaces reserved exclusively for persons with disabilities — parking in these spaces without a permit is illegal."
},
{
"title": "Tourist Signs",
"content": "Tourist signs are used to indicate tourist sites, archaeological sites, cultural sites, recreational areas, therapeutic areas (such as hot springs), forests, and any other places of tourist interest. Tourist signs have a brown background with white text and symbols, making them immediately distinguishable from other sign types. They serve both to guide tourists to attractions and to promote tourism. These signs are typically placed on main roads leading to tourist destinations, with directional arrows showing the route. The brown color was chosen internationally to create a distinct category that drivers can easily identify as tourist-related, avoiding confusion with regulatory or warning signs."
},
{
"title": "Consequences of Vandalizing Traffic Signs",
"content": "The Jordanian curriculum explicitly addresses the issue of traffic sign vandalism, describing it as unethical behavior. Vandalism includes placing posters or stickers on signs, damaging signs physically, removing signs, or otherwise interfering with their visibility or function. The consequences of sign vandalism are severe: drivers who cannot see or read signs may miss critical warnings, speed limits, or prohibitions, leading to traffic accidents that could result in injuries or fatalities. Vandalized signs can also cause confusion, leading to drivers taking wrong routes, entering prohibited areas, or failing to yield at intersections. Protecting traffic signs is everyone's responsibility — they are essential infrastructure for road safety."
}
]
},
{
"title": "Road Priorities and Right of Way",
"description": "Detailed explanation of all priority rules and right-of-way regulations in Jordan including priority at intersections, roundabouts, narrow roads, railway crossings, pedestrian crossings, and the specific signs that govern each situation.",
"image": "",
"order": 3,
"isPublished": true,
"lessons": [
{
"title": "Introduction to Road Priority Rules",
"content": "Road priority rules determine which vehicle has the right to proceed first when two or more vehicles or road users converge at the same point. These rules are essential for preventing collisions and maintaining orderly traffic flow. In Jordan, priority rules are established through traffic signs, road markings, and general legal principles. Understanding and following priority rules is not optional — it is a legal obligation. Failure to yield the right of way is one of the major contributing factors to traffic accidents in Jordan, representing a significant portion of driver errors. Priority rules exist to create predictability on the road, so that every road user knows what to expect from others."
},
{
"title": "The General Right-Side Priority Rule",
"content": "In the absence of specific traffic signs, the general rule at uncontrolled intersections in Jordan is that the vehicle approaching from the right has priority. This means that if two vehicles arrive at an intersection at the same time from different directions, the driver on the left must yield to the driver on the right. However, the Jordanian curriculum notes that this rule can create danger at intersections of minor and major roads, which is why priority signs (yield and stop signs) are typically installed at such locations instead of relying solely on the right-side rule. The right-side priority rule should be considered a default that applies only when no other priority indication exists."
},
{
"title": "Understanding the Give Priority (Yield) Sign",
"content": "The give priority sign (inverted triangle, white background, red border) is the primary tool for assigning priority at intersections. When a driver encounters this sign at the end of a side road meeting a main road, they must slow down and give priority to vehicles on the main road. The driver does not need to stop if the road is clear but must always be prepared to stop. This sign is used at intersections where the priority is not obvious, at entrances to expressways, and at the beginning of auxiliary right-turn lanes where there is insufficient distance for acceleration. The sign is placed no more than 25 meters from the edge of the main road."
},
{
"title": "Understanding the Stop Sign and Its Requirements",
"content": "The stop sign (red octagon) requires a complete stop — not a rolling stop or slowing down. The driver must bring the vehicle to a full stop before the stop line or before entering the intersection, check all directions for traffic, and only proceed when it is safe. The stop sign is used at intersections where stopping is necessary for safety, such as where visibility is limited, where speeds are high on the main road, where accidents frequently occur, and at railway crossings without gates. The stop sign cannot be used on main through roads, at intersections with traffic signals, as temporary signs on roads (except in emergencies), or on unpaved roads leading to paved roads. These restrictions ensure that stop signs are only used where truly necessary."
},
{
"title": "Road with Priority: What It Means",
"content": "The road with priority sign (yellow diamond) indicates that the road you are on has priority over all intersecting roads. Vehicles on intersecting roads will face yield or stop signs. The driver on the priority road may continue without stopping at intersections, but should still exercise caution and comply with speed limits. In Jordan, this sign is used sparingly and only when engineering studies justify its necessity. When two priority roads intersect, one of them must have a yield or stop sign installed, because it is impossible for both roads to have simultaneous priority. The end of priority road sign (yellow diamond with a diagonal black line) tells the driver that the priority status is ending and normal priority rules apply from that point forward."
},
{
"title": "Priority at Uncontrolled Intersections",
"content": "At intersections without any traffic signs or signals, the right-side priority rule applies. However, the Jordanian curriculum identifies several situations where stop signs may be installed at such intersections: (a) when a minor road intersects a main road and applying the right-side rule would be dangerous, (b) when a side road intersects a through road, (c) when an intersection within a built-up area is not equipped with traffic signals, and (d) at other intersections where high speeds, insufficient visibility, or frequent accidents make additional controls necessary. Drivers should never assume they have priority at an unfamiliar intersection — they should always slow down and check for signs before proceeding."
},
{
"title": "Priority at Signalized Intersections",
"content": "At intersections controlled by traffic signals, priority is determined by the signal indications. A green light gives the driver permission to proceed, but the driver must still yield to any vehicles or pedestrians remaining in the intersection. A yellow light warns that the signal is about to change to red — the driver should stop if it is safe to do so, but should not stop abruptly if already too close to the intersection. A red light requires a complete stop before the stop line or before entering the intersection. When signals are not functioning (power outage or malfunction), the intersection should be treated as an uncontrolled intersection, and the right-side priority rule applies unless police officers are directing traffic."
},
{
"title": "Priority at Roundabouts",
"content": "At roundabouts, the fundamental priority rule is that vehicles already inside the roundabout have priority over vehicles entering. The roundabout warning sign alerts the driver to reduce speed and give priority to vehicles within the roundabout. The mandatory roundabout sign (blue circle with circular arrow) commands the driver to follow the circular path. When entering a roundabout, the driver must yield to traffic already circulating, wait for a safe gap, and then enter smoothly. Once inside the roundabout, the driver has priority over entering vehicles. The driver should signal their intention to exit by using the right turn signal before reaching their exit. In multi-lane roundabouts, the driver should choose the appropriate lane based on their intended exit."
},
{
"title": "Priority at T-Junctions",
"content": "T-junctions (where one road ends at another) have specific priority rules depending on the signs installed. If the ending road has a yield sign, vehicles on the ending road must yield to vehicles on the through road. If the ending road has a stop sign, vehicles must come to a complete stop before entering the through road. The Jordanian curriculum shows three variations of T-junction warning signs: main road with two side roads, main road with one side road from the left, and main road with one side road from the right. In all cases, the driver on the side road must reduce speed, identify the appropriate priority, and yield to traffic on the main road."
},
{
"title": "Priority on Narrow Roads and Single-Lane Sections",
"content": "When a road narrows to the point where two vehicles cannot pass simultaneously, priority signs are used. The priority for oncoming traffic sign (red arrow pointing up) tells the driver to wait for oncoming vehicles to pass first. The priority for entering traffic sign (blue square with white and red arrows) tells the driver they have priority to enter the narrow section. These signs are placed in pairs — one facing each direction — so that one direction has priority and the other must yield. The sign giving priority must be placed so that the entire narrow section is visible to the driver approaching from the non-priority direction. If no signs are present, the vehicle going uphill typically has priority, and the downhill vehicle should pull over."
},
{
"title": "Priority at Railway Crossings",
"content": "Trains always have absolute priority at railway crossings. The driver must never try to beat a train to a crossing. At crossings with gates or barriers, the driver must stop when the gates begin to lower or when warning lights are activated. At crossings without gates, the driver must slow down, look and listen for trains, and stop if a train is approaching. When a stop sign is placed at a railway crossing, the driver must come to a complete stop regardless of whether a train is visible. The Jordanian curriculum includes five different warning signs for railway crossings, each indicating specific conditions (with gates, without gates, multiple tracks, single track, tracks at different distances). All railway crossing situations require the driver to give absolute priority to trains."
},
{
"title": "Priority for Pedestrians at Crossings",
"content": "Pedestrians have priority at marked pedestrian crossings. When a driver approaches a pedestrian crossing marked by the warning sign, they must reduce speed to 30 km/h and stop before the crossing if pedestrians are crossing or appear about to cross. The driver must not proceed until all pedestrians have completely cleared the crossing. This rule applies to all pedestrian crossings, whether on urban or rural roads. In Jordan, pedestrians account for the highest fatality rate among all road user categories at 36.1% of all fatalities, making pedestrian priority enforcement critical. Drivers must be especially vigilant near schools, markets, and residential areas where pedestrian crossings are common."
},
{
"title": "Priority for Students in School Zones",
"content": "The school zone sign (showing students) requires drivers to reduce speed to 30 km/h and give special attention and priority to students. This sign is placed near schools where students may be walking, crossing roads, or boarding/unboarding buses. Children are unpredictable road users who may suddenly dart into the road, and their smaller size makes them less visible to drivers. The driver must exercise extreme caution in school zones, be prepared to stop at any time, and never assume that children will follow traffic rules. School zone speed limits are strictly enforced, and violations carry heavier penalties due to the vulnerability of children."
},
{
"title": "Priority for Cyclists at Crossings",
"content": "The bicycle crossing sign indicates a point where cyclists may enter or cross the roadway. Drivers must reduce speed and give priority to bicycles at these crossings. Cyclists are vulnerable road users who require special consideration. When passing a cyclist on the road, the driver should maintain at least 1 meter of lateral distance in urban areas and more on highways. The driver should never honk at cyclists, cut them off, or pass too closely, as this can startle the cyclist and cause a fall. The mandatory bicycle lane sign also indicates that cyclists have a dedicated path, and drivers must not enter or obstruct this path."
},
{
"title": "Priority in Work Zones",
"content": "In work zones (construction areas), the road works warning sign instructs drivers to reduce speed, follow the designated lane, exercise caution, and give priority to vehicles that have the right of way in the work zone. Work zones often have temporary traffic patterns that differ from normal conditions, including temporary lane closures, detours, and flagger-controlled sections. When a flagger or traffic controller is present, their instructions take priority over any other signs or signals. Drivers must be patient in work zones and understand that temporary delays are necessary for worker safety and road improvement."
},
{
"title": "Priority for Emergency Vehicles",
"content": "Emergency vehicles (ambulances, fire trucks, police cars) with active sirens and/or flashing lights have absolute priority over all other traffic. When an emergency vehicle approaches, all drivers must pull over to the right side of the road and stop until the emergency vehicle has passed. On multi-lane roads, drivers in all lanes should move to the right if possible. If moving right is not possible, the driver should stop in place and clear a path. Drivers must not follow emergency vehicles closely, block intersections, or impede their progress in any way. After the emergency vehicle has passed, the driver should check for additional emergency vehicles before resuming travel and should not follow the emergency vehicle to reach their destination faster."
},
{
"title": "Priority When Merging",
"content": "When a vehicle merges into traffic (such as entering a highway from an acceleration lane), the merging vehicle must yield to vehicles already on the main roadway. However, drivers on the main roadway are encouraged to move over a lane if possible to allow smoother merging. The give priority sign may be placed at the beginning of acceleration lanes where the distance is insufficient for normal merging speeds. When a lane ends and traffic must merge (lane drop), the vehicle in the ending lane must yield to vehicles in the continuing lane, following the zipper merge principle — vehicles in the ending lane should use the full length of the lane and merge one at a time at the merge point."
},
{
"title": "Priority When Exiting a Roundabout",
"content": "While vehicles inside a roundabout have priority over entering vehicles, a driver exiting a roundabout must yield to pedestrians crossing the exit road. The driver should signal their intention to exit by activating the right turn signal before reaching their exit. After exiting, the driver must give priority to any pedestrians at the crossing and to other vehicles as required by the traffic signs at that location. The driver should not stop inside the roundabout to allow others to enter — this would disrupt the flow of traffic and could cause a collision."
},
{
"title": "Violating Priority Rules: Consequences",
"content": "Violating priority rules is a serious traffic offense in Jordan. Failure to yield the right of way is one of the most common causes of traffic accidents, contributing significantly to the 98.8% of accidents attributed to human error. Consequences include traffic fines, penalty points on the driver's license, increased insurance premiums, and potential criminal liability if the violation results in injury or death. The Jordanian curriculum emphasizes that understanding and following priority rules is fundamental to road safety. A moment of impatience or inattention at an intersection can have lifelong consequences for the driver, passengers, and other road users."
},
{
"title": "Advanced Warning Signs for Priority Changes",
"content": "The Jordanian curriculum specifies that advance warning signs must be placed before yield and stop signs when visibility conditions require them. When visibility is less than 150 meters and the speed limit is 80 km/h or less, an advance warning sign must be installed. When visibility is less than 200 meters and the speed limit exceeds 80 km/h, an advance warning sign must be installed. Similarly, advance warning signs must be placed before road-with-priority signs and their end signs. These advance warnings give drivers additional time to prepare for the priority change, reducing the risk of last-second decisions that can lead to accidents."
},
{
"title": "Special Priority Situations and Edge Cases",
"content": "Several special situations require specific priority considerations. When two priority roads intersect, one must have a yield or stop sign — simultaneous priority is impossible. When a vehicle is making a left turn, it must yield to oncoming traffic going straight or turning right. When entering a road from a private driveway or parking lot, the entering vehicle must yield to all road traffic. When a bus is re-entering traffic from a bus stop, the driver should yield if safe to do so. When encountering a funeral procession, drivers should yield and not interrupt the procession. When driving on mountain roads, the vehicle going uphill generally has priority over the vehicle going downhill. These special cases require judgment and courtesy in addition to knowledge of the rules."
}
]
},
{
"title": "Speed Limits and Safe Following",
"description": "Comprehensive coverage of speed regulations, speed limit signs, factors affecting safe speed, the concept of safe following distance, and the relationship between speed and accident severity in Jordan.",
"image": "",
"order": 4,
"isPublished": true,
"lessons": [
{
"title": "Introduction to Speed and Road Safety",
"content": "Speed is one of the most critical factors in road safety. The Jordanian curriculum dedicates a full chapter to speed on roads and traffic safety, recognizing that inappropriate or excessive speed is a major contributor to traffic accidents and their severity. In Jordan, inappropriate speed and high speed are listed among the primary factors causing accidents. Speed affects every aspect of driving: it reduces the time available to react to hazards, increases the distance needed to stop, increases the severity of collisions, and reduces the effectiveness of vehicle safety systems. Understanding speed management is therefore essential for every driver."
},
{
"title": "Understanding Posted Speed Limits",
"content": "Posted speed limits are the maximum legal speeds for specific road sections, indicated by circular red-bordered signs with black numbers. Speed limits are set based on engineering studies that consider road design, traffic density, surrounding land use, accident history, and visibility conditions. The maximum speed sign applies to all vehicles unless a separate sign specifies a lower limit for certain vehicle types (such as trucks and small buses). Speed limits are not suggestions — they are legally enforceable limits. The end of speed limit sign indicates that the specific limit has ended and the driver must follow the general speed limits for that road type or subsequent signs."
},
{
"title": "Speed Limits for Trucks and Small Buses",
"content": "The Jordanian curriculum includes a specific sign setting maximum speed limits for trucks and small buses, which is lower than the general speed limit. This reflects the fact that heavy vehicles have longer stopping distances, reduced maneuverability, and greater potential for damage in collisions. Trucks weighing more than 3.5 tons are subject to these lower limits. Additionally, trucks over 3.5 tons are prohibited from overtaking on certain roads to avoid the increased risk associated with their size and speed. Drivers of heavy vehicles must always be aware of their specific speed restrictions and comply with them, even if other vehicles are traveling faster."
},
{
"title": "Speed Limits in Special Zones",
"content": "Certain areas have reduced speed limits regardless of the general road speed. Near schools, the speed limit is reduced to 30 km/h when students are present. Near pedestrian crossings, the driver must reduce speed to 30 km/h. In tunnels, the speed limit is 50 km/h. In work zones, temporary speed limits are posted and must be strictly followed — fines for speeding in work zones are often doubled. Near hospitals, the use of horns is prohibited, and reduced speeds are expected. In residential areas, speed limits are typically lower to protect pedestrians, children, and residents. The driver must always be alert for signs indicating special speed zones."
},
{
"title": "The Concept of Appropriate Speed",
"content": "The posted speed limit is the maximum for ideal conditions, but the appropriate speed may be significantly lower depending on conditions. The Jordanian curriculum distinguishes between 'excessive speed' (above the limit) and 'inappropriate speed' (too fast for conditions even if below the limit). Appropriate speed takes into account: weather conditions (rain, fog, ice), road surface conditions (wet, damaged, slippery), visibility (night, curves, hills), traffic density, pedestrian activity, road works, and the driver's experience and the vehicle's condition. A responsible driver adjusts their speed to conditions rather than blindly following the posted limit. Driving at the speed limit in heavy rain or fog may still be dangerous and could result in a citation for driving too fast for conditions."
},
{
"title": "How Speed Affects Stopping Distance",
"content": "Stopping distance consists of three components: perception distance (the distance traveled during the time it takes to perceive a hazard), reaction distance (the distance traveled during the time it takes to react and begin braking), and braking distance (the distance traveled from the moment brakes are applied until the vehicle stops). All three distances increase with speed, but braking distance increases exponentially — doubling the speed approximately quadruples the braking distance. For example, at 30 km/h the braking distance might be 10 meters, but at 60 km/h it could be 40 meters, and at 120 km/h it could be 160 meters. This exponential relationship means that small increases in speed lead to large increases in stopping distance, making speed management critical for safety."
},
{
"title": "How Speed Affects Accident Severity",
"content": "The severity of a collision increases dramatically with speed. The kinetic energy of a vehicle increases with the square of its speed — doubling the speed quadruples the energy. In a collision, this energy must be absorbed by the vehicle's structure and the occupants' bodies. At 30 km/h, a pedestrian has approximately a 10% chance of being killed if hit by a car. At 50 km/h, the chance increases to about 80%. At speeds above 80 km/h, the chance of a pedestrian fatality is nearly 100%. This is why speed limits of 30 km/h are imposed near pedestrian crossings and schools. Speed also affects the likelihood of losing control — higher speeds provide less margin for error and make recovery from skids or swerves much more difficult."
},
{
"title": "Speed and Pedestrian Safety",
"content": "The relationship between vehicle speed and pedestrian survival rates is one of the most important concepts in road safety. Research consistently shows that small reductions in vehicle speed lead to large improvements in pedestrian survival rates. At impact speeds below 30 km/h, most pedestrians survive with minor or moderate injuries. At 40-50 km/h, the probability of fatal injury rises sharply. Above 50 km/h, fatal injuries become the norm. This is precisely why the Jordanian curriculum mandates a speed of 30 km/h near pedestrian crossings and school zones. Every kilometer per hour matters when it comes to pedestrian safety, and drivers who exceed these limits are directly increasing the likelihood of killing a pedestrian."
},
{
"title": "Introduction to Safe Following Distance",
"content": "Safe following distance is the space maintained between your vehicle and the vehicle ahead. It is one of the most important safety concepts in driving because it provides the time and space needed to react to sudden stops or emergencies by the vehicle ahead. The Jordanian curriculum dedicates a full chapter to the safety distance between vehicles, recognizing that failure to maintain adequate following distance is a major cause of rear-end collisions, which constitute a significant portion of all traffic accidents. The general principle is simple: the faster you are going, the more distance you need."
},
{
"title": "The Two-Second Rule for Following Distance",
"content": "The two-second rule is the standard method for determining safe following distance under normal conditions. The driver should select a fixed point ahead (such as a sign, tree, or road marking) and note when the vehicle ahead passes it. The driver then counts 'one-thousand-one, one-thousand-two.' If they reach the fixed point before finishing the count, they are following too closely and must increase their distance. Under normal dry-road conditions, a minimum of two seconds is required. This distance provides enough time to perceive a hazard, react, and begin braking. The two-second rule works at any speed because following distance naturally increases with speed when measured in time rather than distance."
},
{
"title": "Adjusting Following Distance for Conditions",
"content": "The two-second rule is a minimum for ideal conditions. The following distance must be increased in adverse conditions: on wet or slippery roads, increase to at least 3-4 seconds; on icy or snow-covered roads, increase to 6-8 seconds or more; at night, increase to 3-4 seconds due to reduced visibility; when following a large vehicle (truck, bus) that blocks your view, increase to 3-4 seconds; when being followed closely by another vehicle, increase your following distance from the vehicle ahead to create more reaction space for both; when towing a trailer or carrying a heavy load, increase following distance due to longer stopping distances. The driver should always err on the side of more distance rather than less."
},
{
"title": "Following Distance and Heavy Vehicles",
"content": "Special following distance considerations apply when interacting with heavy vehicles. When following a truck or bus, the driver should maintain at least 3-4 seconds of following distance because: (a) the large vehicle blocks the view of the road ahead, preventing the driver from seeing hazards; (b) if the truck brakes suddenly, a car following too closely may not have enough space to stop; (c) debris from the truck's tires or load may require evasive action. When a truck is following your vehicle, you should increase your following distance from the vehicle ahead to create a larger safety buffer, since the truck behind you cannot stop as quickly as you can."
},
{
"title": "Speed and Visibility Conditions",
"content": "Reduced visibility directly affects safe speed. At night, headlights typically illuminate only about 60-100 meters ahead, meaning the driver cannot see hazards beyond that distance. The safe speed at night is the speed at which the vehicle can stop within the illuminated distance. In fog, visibility may be reduced to just a few meters, requiring very low speeds. In heavy rain, both visibility and road grip are reduced. The Jordanian curriculum includes warning signs for various visibility-reducing conditions: fog, dust storms, falling rocks, and curves with limited visibility. The driver must always match their speed to the distance they can see ahead — if you cannot stop within the distance you can see, you are driving too fast."
},
{
"title": "Speed on Curves and Hills",
"content": "Curves and hills require speed reduction beyond the posted limit. The safe speed for a curve depends on its radius, the road surface condition, and the vehicle's characteristics. Warning signs for curves indicate that the driver must reduce speed and avoid overtaking. On hilltops, visibility is limited to the crest, and the driver cannot see oncoming traffic or hazards over the hill — speed must be reduced accordingly. On steep descents, the driver must control speed using engine braking and avoid riding the brakes, which can cause brake fade and failure. The Jordanian curriculum includes warning signs for right curves, left curves, successive curves, steep descents, and steep ascents, all requiring the driver to adjust their speed."
},
{
"title": "Speed in Work Zones",
"content": "Work zones have specific speed requirements that must be strictly followed. The road works warning sign instructs drivers to reduce speed, follow the designated lane, and exercise caution. Work zones often have narrowed lanes, uneven surfaces, workers near the roadway, and construction equipment entering and exiting. Speed limits in work zones are significantly lower than normal and are enforced with increased penalties. The Jordanian curriculum emphasizes giving priority to vehicles that have right of way in the work zone. Drivers should reduce speed before entering the work zone, not within it, to ensure they are at the correct speed when encountering the changed conditions."
},
{
"title": "Speed in Tunnels",
"content": "The Jordanian curriculum specifies a speed limit of 50 km/h in tunnels. This reduced limit accounts for the confined space, potential changes in road surface (tunnel floors may be more slippery due to exhaust deposits), limited escape routes in case of emergency, and the visual adjustment needed when entering and exiting tunnels (due to sudden changes in light levels). The driver must also stay in their lane and not overtake inside the tunnel. Before entering a tunnel, the driver should already be at or near the tunnel speed limit — sudden deceleration inside a tunnel can cause rear-end collisions."
},
{
"title": "Speed and Road Surface Conditions",
"content": "The road surface significantly affects the safe speed. The Jordanian curriculum includes a slippery road warning sign for sections with reduced traction. On wet roads, stopping distances can double compared to dry roads. During the first 30 minutes of rainfall, roads are particularly slippery because oil and dust mix with water before being washed away. On gravel or unpaved roads, traction is significantly reduced. On roads with potholes or damage (indicated by the uneven road sign), speed must be reduced to avoid loss of control or vehicle damage. The driver must continuously assess road surface conditions and adjust speed accordingly."
},
{
"title": "Speed and Vehicle Condition",
"content": "The safe speed for a vehicle depends on its condition. A vehicle with worn tires has significantly reduced grip, requiring lower speeds. Worn brake pads increase stopping distance. Faulty suspension affects handling and stability. Overloaded vehicles have longer stopping distances and reduced maneuverability. Vehicles towing trailers behave differently, especially in crosswinds and during braking. The Jordanian curriculum lists vehicle defects (brakes, steering, lights, tires) among the factors contributing to accidents. A driver must know their vehicle's condition and adjust their speed to compensate for any deficiencies — or, better yet, ensure the vehicle is properly maintained before driving."
},
{
"title": "Speed and Driver Experience",
"content": "The driver's experience level significantly affects the appropriate speed. In Jordan, drivers aged 18-35 represent the largest group involved in injury accidents relative to their share of registered drivers (42.7%). New drivers have not yet developed the perceptual skills, judgment, and vehicle control abilities of experienced drivers. New drivers should travel below the speed limit, especially in their first year of driving, to compensate for their lack of experience. The Jordanian curriculum notes that controlling and monitoring driver training centers is a key strategy for reducing accidents, suggesting that proper training can help new drivers develop appropriate speed management skills."
},
{
"title": "Speed Statistics in Jordan",
"content": "Understanding speed-related statistics helps emphasize the importance of speed management. In Jordan in 2022, there were 10,431 injury accidents resulting in 571 deaths and 16,203 injuries. The cost of traffic accidents in 2022 was estimated at 322 million Jordanian dinars. While specific speed-related accident numbers vary, excessive and inappropriate speed is consistently identified as a major contributing factor. The fatality rate is 5.5 per 100,000 population, and the injury rate is 157.2 per 100,000 population. Reducing inappropriate speeds would directly reduce both the number and severity of accidents, saving lives and reducing the economic burden on society."
},
{
"title": "Legal Consequences of Speeding",
"content": "Speeding is a traffic violation in Jordan that carries specific penalties including fines, penalty points on the driver's license, and potential license suspension for repeat offenders. Speeding in special zones (school zones, work zones) carries enhanced penalties. The Jordanian curriculum includes a chapter on violations and penalties, and another on vehicle impoundment and driver detention cases. Excessive speeding that results in an accident can lead to criminal charges, including manslaughter if fatalities occur. The legal consequences are in addition to the physical, emotional, and financial consequences of a speed-related accident. The message is clear: speeding is not worth the risk."
},
{
"title": "The Relationship Between Speed and Overtaking",
"content": "Speed management is critical during overtaking maneuvers. The Jordanian curriculum prohibits overtaking at locations with insufficient visibility, including curves, hilltops, and areas marked with no-overtaking signs. When overtaking, the speed differential between the overtaking vehicle and the overtaken vehicle determines how quickly the maneuver can be completed. Higher speeds require longer distances to complete overtaking safely and leave less margin for error. The no-overtaking sign for trucks (vehicles over 3.5 tons) reflects the fact that trucks need more distance to overtake and their higher speeds during overtaking create greater risk. The end of no-overtaking zone sign indicates that it is safe to overtake again, provided the driver chooses an appropriate time and place."
},
{
"title": "Technology and Speed Enforcement",
"content": "Modern speed enforcement technology plays an important role in ensuring compliance with speed limits. The Jordanian curriculum includes a chapter on techniques for detecting traffic violations, which includes speed detection methods such as radar guns, speed cameras, and automated enforcement systems. These technologies allow for consistent and objective enforcement of speed limits, reducing the element of human discretion that can lead to inconsistent enforcement. Drivers should be aware that speed enforcement can occur anywhere and at any time, and the best strategy is to always comply with posted speed limits rather than trying to anticipate where enforcement may be present."
},
{
"title": "Building a Speed Management Mindset",
"content": "Safe driving requires developing a mindset where speed management is automatic and continuous. This means: always checking the speedometer regularly, not just when you see a speed sign; automatically reducing speed when conditions change rather than waiting for a sign; understanding that arriving a few minutes earlier is never worth the risk of an accident; resisting peer pressure to drive faster; planning trips with adequate time to avoid feeling rushed; and recognizing that the most skilled drivers are not those who drive fast, but those who consistently choose appropriate speeds for conditions. The Jordanian curriculum's extensive coverage of speed-related topics reflects the fundamental importance of this skill for road safety."
}
]
},
{
title: "Seat Belt Safety and Passenger Rules",
"description": "Detailed coverage of seat belt requirements, child restraint systems, passenger safety obligations, rules for transporting passengers and goods, and the consequences of non-compliance with safety regulations in Jordan.",
"image": "",
"order": 5,
"isPublished": true,
"lessons": [
{
"title": "Introduction to Seat Belt Safety",
"content": "Seat belts are the most effective safety device in a vehicle, yet their non-use remains a significant factor in the severity of traffic accident injuries. The Jordanian curriculum identifies failure to use seat belts among the factors that increase the severity of injuries during and after accidents. Seat belts reduce the risk of fatal injury by approximately 45-50% for front-seat occupants and by about 60% for rear-seat occupants. They work by distributing the forces of a collision across the strongest parts of the body (pelvis and chest), preventing occupants from being thrown against the interior of the vehicle or ejected from it. In Jordan, where traffic accidents caused 571 deaths and 16,203 injuries in 2022, seat belt use could have significantly reduced these numbers."
},
{
"title": "How Seat Belts Work",
"content": "A seat belt is a restraining system designed to secure the occupant against harmful movement that may result from a collision or sudden deceleration. During a collision, the vehicle decelerates rapidly, but the occupant's body continues moving at the pre-crash speed due to inertia. Without a seat belt, the occupant strikes the steering wheel, dashboard, windshield, or other occupants, or is ejected through the windshield. The seat belt locks almost instantly during a collision, holding the occupant in their seat and distributing the deceleration forces across the chest and pelvis over a wider area and longer time, reducing the peak force on any single part of the body. Modern seat belts also include pretensioners that remove slack instantly and load limiters that allow controlled belt stretch to further reduce peak forces."
},
{
"title": "Legal Requirements for Seat Belt Use in Jordan",
"content": "Jordanian traffic law requires all occupants of a motor vehicle to wear seat belts while the vehicle is in motion. This applies to the driver and all passengers, both in the front and rear seats. The requirement applies on all roads and at all times — there is no exception for short trips, low speeds, or familiar roads. The Jordanian curriculum includes vehicle safety systems as a key topic, and the legal framework for traffic violations specifies penalties for failure to wear seat belts. Law enforcement officers can issue citations for seat belt violations during routine traffic stops or checkpoints. The driver is responsible for ensuring that all passengers under their supervision are wearing seat belts."
},
{
"title": "Common Myths About Seat Belts",
"content": "Several dangerous myths about seat belts persist: (1) 'Seat belts trap you in the vehicle' — in reality, the risk of being trapped is extremely small compared to the risk of being ejected, and ejected occupants are 4 times more likely to die; (2) 'I'm a good driver, I don't need a seat belt' — you cannot control other drivers, and most accidents are caused by someone else's error; (3) 'Seat belts are uncomfortable' — modern seat belts are adjustable and the discomfort is minimal compared to the pain of injuries; (4) 'I'll just hold on' — at 50 km/h, a 70 kg person generates a force of over 1.5 tons in a collision — no one can hold on with that force; (5) 'Airbags are enough' — airbags are designed to work WITH seat belts, not replace them; without a seat belt, the occupant may be thrown into the deploying airbag with fatal force."
},
{
"title": "Correct Seat Belt Usage",
"content": "For a seat belt to be effective, it must be worn correctly. The lap belt should be positioned low across the hips and pelvis, never across the stomach where it could cause internal injuries. The shoulder belt should cross the center of the chest and collarbone, never under the arm or behind the back, which would eliminate upper body protection. The belt should be snug with no slack — you should not be able to pull more than a few centimeters of webbing. The belt should not be twisted, as this concentrates forces on a smaller area. Pregnant women should wear the lap belt below the belly, not across it. The seat belt should be adjusted for the occupant's size using the height adjuster if available. A seat belt worn incorrectly provides significantly less protection."
},
{
"title": "Seat Belts for Rear Seat Passengers",
"content": "Rear seat passengers are often less likely to wear seat belts, but they face significant risks without them. In a frontal collision, an unrestrained rear-seat passenger is thrown forward with tremendous force, striking the front seats, the front-seat occupants, or the windshield. This can cause fatal injuries to both the unrestrained rear passenger and the front-seat occupants. Studies show that an unrestrained rear passenger increases the risk of death for the front-seat driver by a factor of 5. In Jordan, where families frequently travel together, ensuring that all rear-seat passengers are belted is critical. The driver should always check that rear passengers are buckled before starting the vehicle."
},
{
"title": "Child Restraint Systems: Overview",
"content": "The Jordanian curriculum identifies failure to use child safety seats as one of the factors that increase injury severity in accidents. Children cannot safely use adult seat belts because the belts are designed for adult body proportions. A standard seat belt crosses a child's neck and abdomen rather than their chest and pelvis, which can cause severe internal injuries in a collision. Child restraint systems (car seats, booster seats) are specifically designed to protect children at different stages of their physical development. Using the appropriate restraint for a child's age, weight, and height is one of the most important safety decisions a parent can make."
},
{
"title": "Types of Child Restraint Systems",
"content": "Child restraint systems are classified by the child's age, weight, and height: (1) Rear-facing infant seats — for infants from birth to approximately 1 year or up to 13 kg, providing the best protection for the baby's head, neck, and spine; (2) Forward-facing child seats — for children approximately 1-4 years or 9-18 kg, with a harness system that distributes crash forces; (3) Booster seats — for children approximately 4-8 years or 15-36 kg, which elevate the child so the adult seat belt fits correctly across the chest and hips; (4) Seat belts alone — for children over 8 years or taller than 145 cm, when the adult belt fits properly. The specific age and weight ranges may vary by manufacturer, and the parent should always follow the manufacturer's instructions."
},
{
"title": "Installation and Usage of Child Seats",
"content": "Proper installation of a child seat is essential for its effectiveness. The seat must be securely fastened using the vehicle's seat belt or the ISOFIX/LATCH system (if available). It should not move more than 2.5 cm in any direction when tested at the belt path. For rear-facing seats, the recline angle must be correct to support the baby's head. The harness straps should be at or below shoulder level for rear-facing seats and at or above shoulder level for forward-facing seats. The harness should be snug — you should not be able to pinch any slack at the collarbone. The chest clip should be at armpit level. Children under 13 should always ride in the back seat, as front airbags can be dangerous to them."
},
{
"title": "Rules for Transporting Passengers",
"content": "The Jordanian curriculum includes a section on transporting passengers and goods. General rules include: the number of passengers must not exceed the vehicle's designated capacity (number of seat belts); passengers must not ride in areas not designed for passengers (such as the cargo area of a pickup truck); passengers must not obstruct the driver's view or ability to operate the vehicle; doors must be securely closed while the vehicle is moving; passengers must not extend any body part outside the vehicle window. The driver is legally responsible for the safety of their passengers and must ensure all safety requirements are met before starting the journey."
},
{
"title": "Rules for Transporting Goods",
"content": "The Jordanian curriculum's section on transporting passengers and goods establishes rules for carrying cargo. Goods must be secured properly to prevent shifting during braking, acceleration, or turning, which could affect vehicle stability or injure occupants. Goods must not obstruct the driver's view through any window or mirror. Goods must not block access to doors or emergency exits. The total weight of goods must not exceed the vehicle's payload capacity. Overloading affects braking, handling, and stability, and is illegal. Specific rules apply to different types of goods — the curriculum includes a separate section on transporting dangerous or flammable materials, which requires special permits and safety measures."
},
{
"title": "Passenger Safety Responsibilities",
"content": "While the driver has primary responsibility for passenger safety, passengers also have responsibilities. Passengers must wear their seat belts at all times and should not attempt to disable or circumvent safety systems. Passengers should not distract the driver with loud conversations, sudden movements, or requests that take the driver's attention off the road. Passengers should not interfere with the driver's control of the vehicle (steering, pedals, gears). Passengers have a right to request the driver to slow down, drive more carefully, or stop if they feel unsafe. Every passenger has a role in creating a safe driving environment."
},
{
"title": "Special Passenger Categories",
"content": "Certain passenger categories require special attention: (1) Children — require appropriate restraint systems and should ride in the back seat; (2) Elderly persons — may need assistance with seat belts and may be more vulnerable to injury; (3) Persons with disabilities — may require specialized restraint systems or vehicle modifications; (4) Pregnant women — must wear seat belts correctly (lap belt below the belly); (5) Infants — must never be held in a passenger's arms, as they would be crushed by the force of a collision. The Jordanian curriculum includes a guide sign for parking spaces reserved for persons with disabilities, indicating that accessibility and safety for all road users is a priority."
},
{
"title": "Transporting Students by Bus",
"content": "The Jordanian curriculum includes a dedicated section on organizing student transport by buses and medium passenger vehicles. This reflects the special responsibility involved in transporting children. Rules for student transport include: vehicles must meet specific safety standards; drivers must have appropriate qualifications and clean driving records; students must remain seated while the bus is moving; emergency exits must be functional and accessible; the driver must follow designated routes and stops; loading and unloading procedures must be followed to ensure student safety. A separate section addresses service providers for school transport for educational institutions, setting standards for the entire school transport system."
},
{
"title": "Vehicle Safety Systems Beyond Seat Belts",
"content": "The Jordanian curriculum dedicates a full section to vehicle safety systems (أنظمة السلامة في المركبة). Beyond seat belts, these include: airbags (which supplement seat belts by providing cushioning for the head and chest), anti-lock braking systems (ABS) that prevent wheel lockup during hard braking, electronic stability control (ESC) that helps prevent skidding, crumple zones that absorb impact energy, side impact protection systems, head restraints that prevent whiplash, and structural reinforcement. The driver should know which safety systems their vehicle has and understand how they function. However, no safety system can compensate for reckless driving — they are designed to reduce injury severity when accidents occur, not to prevent accidents caused by driver error."
},
{
"title": "Head Restraints and Whiplash Prevention",
"content": "Head restraints are an important but often overlooked safety feature. They are designed to prevent whiplash injuries in rear-end collisions by limiting the backward movement of the head relative to the torso. To be effective, the head restraint must be properly adjusted: the center of the restraint should align with the top of the ears, and the distance between the back of the head and the front of the restraint should be as small as possible (ideally less than 10 cm). Many drivers leave head restraints in the lowest position, which provides no protection. Some vehicles have active head restraints that move forward during a rear-end collision to close the gap automatically. Properly adjusted head restraints can reduce whiplash injuries by up to 40%."
},
{
"title": "Airbags and How They Complement Seat Belts",
"content": "Airbags are supplemental restraint systems designed to work in conjunction with seat belts, not replace them. When a collision is detected, the airbag inflates in milliseconds to provide a cushioning surface for the occupant's head and chest. Without a seat belt, the occupant may be thrown into the airbag as it deploys at speeds of up to 300 km/h, which can cause severe or fatal injuries. Airbags are particularly dangerous for children under 12, who should always ride in the back seat. Side airbags protect the torso and head in side-impact collisions. Curtain airbags protect the heads of all occupants in side impacts and rollovers. The driver should know how many airbags their vehicle has and where they are located to avoid placing objects or body parts in their deployment path."
},
{
"title": "The Consequences of Not Using Seat Belts",
"content": "The Jordanian curriculum identifies non-use of seat belts and child restraints as a factor that increases both the likelihood and severity of injuries in accidents. The consequences of not wearing a seat belt include: (1) Ejection from the vehicle — ejected occupants are 4 times more likely to die than those who remain inside; (2) Impact with interior surfaces — striking the steering wheel, dashboard, or windshield at even moderate speeds causes severe injuries; (3) Being thrown into other occupants — an unbelted occupant becomes a projectile that can injure or kill belted occupants; (4) Increased medical costs — unbelted occupants require more extensive and expensive medical treatment; (5) Legal consequences — fines and penalty points for not wearing a seat belt, and potentially reduced insurance coverage if injured while unbelted."
},
{
"title": "Injury Severity Factors in Accidents",
"content": "The Jordanian curriculum categorizes the factors that increase injury severity during and after accidents. These include: (1) Inappropriate or excessive speed — higher speeds cause more severe injuries; (2) Non-use of seat belts, child restraints, or motorcycle helmets — these devices significantly reduce injury severity; (3) Insufficient protection for occupants and pedestrians in the vehicle — older vehicles without modern safety features provide less protection; (4) Impact with solid objects — striking trees, poles, barriers, or rocks on the roadside causes more severe injuries than impacts with deformable objects. Understanding these factors helps drivers appreciate why safety systems matter and why defensive driving is essential."
},
{
"title": "Post-Accident Factors Affecting Injury Outcomes",
"content": "Beyond the collision itself, the Jordanian curriculum identifies factors that affect injury outcomes after an accident: (1) Delay in emergency services reaching the scene — longer response times lead to worse outcomes; (2) Difficulty in rescuing or extracting injured persons from the vehicle — proper use of seat belts does not significantly impede rescue, but vehicle deformation can; (3) Insufficient pre-hospital medical care — first aid provided at the scene can make a critical difference; (4) Insufficient emergency care at hospitals — the quality of emergency department care affects recovery outcomes. These factors underscore the importance of the entire emergency response system, from the driver's decision to wear a seat belt (which reduces the need for emergency care) to the quality of hospital care."
},
{
"title": "Helmets for Motorcycle and Bicycle Riders",
"content": "The Jordanian curriculum includes helmets among the safety equipment whose non-use increases injury severity. For motorcycle riders, helmets reduce the risk of death by approximately 40% and the risk of head injury by about 70%. For bicycle riders, helmets reduce the risk of head injury by about 60-70%. The helmet must be properly certified, correctly sized, and securely fastened. A loose or improperly worn helmet can come off during a crash, providing no protection. The helmet should cover the forehead, with the bottom edge about 2 finger-widths above the eyebrows. The chin strap should be snug — you should not be able to fit more than two fingers between the strap and your chin. Damaged helmets (even from a minor drop) should be replaced."
},
{
"title": "Building a Safety-First Culture",
"content": "The Jordanian curriculum's extensive coverage of safety topics — from traffic signs to vehicle safety systems to accident factors — reflects a comprehensive approach to road safety. Building a safety-first culture means: always wearing seat belts without exception; ensuring all passengers are properly restrained; using appropriate child restraints; maintaining the vehicle in safe condition; following all traffic rules; and never taking shortcuts with safety. The curriculum notes that 98.8% of accidents are caused by human factors, meaning that the vast majority of accidents and injuries are preventable. Every individual decision to buckle up, slow down, or follow the rules contributes to a safer road environment for everyone in Jordan."
}
]
}
];

const quizzesData = [
{
question: "According to the Jordanian curriculum, what percentage of injury accidents in 2022 was attributed to the human element?",
options: ["40.3%", "59.5%", "98.8%", "36.1%"],
correctAnswer: "98.8%",
chapterTitle: "Basic Driving Skills",
explanation: "The curriculum states that the human element contributed to 98.8% of all injury accidents in Jordan in 2022.",
difficulty: "easy"
},
{
question: "What is emphasized as the true nature of driving in the Jordanian curriculum?",
options: ["A right that can be exercised freely", "A routine task requiring minimal effort", "A privilege that comes with significant responsibility", "A competitive activity on the road"],
correctAnswer: "A privilege that comes with significant responsibility",
chapterTitle: "Basic Driving Skills",
explanation: "The curriculum emphasizes that operating a vehicle is a privilege with significant responsibility toward oneself, passengers, and other road users.",
difficulty: "medium"
},
{
question: "If accidents are overwhelmingly caused by human error, what is the most effective way to reduce them?",
options: ["Building wider roads", "Increasing the number of traffic cameras", "Mastering basic driving skills and maintaining constant attention", "Restricting vehicles from driving at night"],
correctAnswer: "Mastering basic driving skills and maintaining constant attention",
chapterTitle: "Basic Driving Skills",
explanation: "Because human factors cause the vast majority of accidents, mastering driving skills and full control over the vehicle at all times is critical.",
difficulty: "hard"
},
{
question: "What is the primary purpose of active safety systems in a vehicle?",
options: ["To reduce injury severity during a crash", "To provide comfort for the driver", "To help prevent accidents from occurring", "To alert emergency services after a crash"],
correctAnswer: "To help prevent accidents from occurring",
chapterTitle: "Basic Driving Skills",
explanation: "Active safety systems, such as brakes, steering, and suspension, help prevent accidents before they happen.",
difficulty: "easy"
},
{
question: "Which of the following is classified as a passive safety system?",
options: ["Anti-lock braking system (ABS)", "Electronic stability control (ESC)", "Airbags", "Traction control system"],
correctAnswer: "Airbags",
chapterTitle: "Basic Driving Skills",
explanation: "Passive safety systems, like seat belts, airbags, and crumple zones, protect occupants during a collision rather than preventing it.",
difficulty: "medium"
},
{
question: "Why should a driver check dashboard warning lights before driving?",
options: ["To ensure the vehicle's battery is fully charged", "To ensure no safety system is compromised before the journey begins", "To test the vehicle's acceleration capabilities", "To reset the trip computer"],
correctAnswer: "To ensure no safety system is compromised before the journey begins",
chapterTitle: "Basic Driving Skills",
explanation: "The curriculum states that a driver must verify all warning lights are functioning properly and that no safety system is compromised before driving.",
difficulty: "hard"
},
{
question: "In Jordan, what percentage of injury accidents is caused by lane violations?",
options: ["25.4%", "40.3%", "59.5%", "98.8%"],
correctAnswer: "40.3%",
chapterTitle: "Basic Driving Skills",
explanation: "The curriculum notes that failure to use turn signals contributes significantly to lane violation accidents, which represent 40.3% of all injury accidents.",
difficulty: "easy"
},
{
question: "At what minimum distance before a turn should a turn signal be activated in urban areas?",
options: ["10 meters", "30 meters", "50 meters", "100 meters"],
correctAnswer: "30 meters",
chapterTitle: "Basic Driving Skills",
explanation: "Jordanian law requires turn signals to be used at least 30 meters before the turn in urban areas and 100 meters or more on highways.",
difficulty: "medium"
},
{
question: "A driver completes a turn but the turn signal does not cancel automatically. What should they do?",
options: ["Continue driving as the signal will eventually turn off", "Turn the steering wheel sharply in the opposite direction", "Cancel it manually to avoid confusing other road users", "Flash the hazard lights to indicate the turn is complete"],
correctAnswer: "Cancel it manually to avoid confusing other road users",
chapterTitle: "Basic Driving Skills",
explanation: "After completing a turn, the driver must ensure the signal has cancelled automatically or cancel it manually so it does not mislead others.",
difficulty: "hard"
},
{
question: "Under a 'no overtaking' sign, is it permissible for a car to pass a motorcycle?",
options: ["Yes, overtaking motorcycles is permitted under this sign", "No, all overtaking is strictly prohibited", "Yes, but only during daylight hours", "No, unless the motorcycle is moving very slowly"],
correctAnswer: "Yes, overtaking motorcycles is permitted under this sign",
chapterTitle: "Basic Driving Skills",
explanation: "The no overtaking sign prohibits overtaking due to limited visibility, but it explicitly permits overtaking of motorcycles.",
difficulty: "easy"
},
{
question: "What is the final step before returning to the original lane after overtaking?",
options: ["Accelerate rapidly to create distance", "Flash your headlights to warn the overtaken vehicle", "Ensure the overtaken vehicle is fully visible in the interior mirror", "Check the side mirror only"],
correctAnswer: "Ensure the overtaken vehicle is fully visible in the interior mirror",
chapterTitle: "Basic Driving Skills",
explanation: "The curriculum specifies that a driver should only return to the original lane when the overtaken vehicle is fully visible in the interior mirror.",
difficulty: "medium"
},
{
question: "Why are trucks weighing more than 3.5 tons additionally prohibited from overtaking on certain roads?",
options: ["Because they consume too much fuel while accelerating", "Due to their longer braking distances and larger blind spots", "Because they block the view of pedestrians on the sidewalk", "To allow smaller vehicles to use both lanes freely"],
correctAnswer: "Due to their longer braking distances and larger blind spots",
chapterTitle: "Basic Driving Skills",
explanation: "The increased risk associated with trucks' longer braking distances, larger blind spots, and the longer distance needed to complete the maneuver justifies this restriction.",
difficulty: "hard"
},
{
question: "What must a driver do when approaching any intersection?",
options: ["Accelerate to clear the intersection quickly", "Maintain speed and watch the traffic lights", "Reduce speed, check for signals/signs, and scan for hazards", "Honk the horn to warn other drivers"],
correctAnswer: "Reduce speed, check for signals/signs, and scan for hazards",
chapterTitle: "Basic Driving Skills",
explanation: "When approaching an intersection, the driver must reduce speed, check for traffic signals or signs, scan all directions, and be prepared to stop.",
difficulty: "easy"
},
{
question: "When is it acceptable to enter an intersection?",
options: ["When the traffic light turns yellow", "Only when there is sufficient space to clear it completely", "When there is a gap in cross traffic, even if it means stopping inside", "When pedestrians have finished crossing the adjacent road"],
correctAnswer: "Only when there is sufficient space to clear it completely",
chapterTitle: "Basic Driving Skills",
explanation: "The driver must never enter an intersection unless there is sufficient space to clear it completely, as blocking it is dangerous and illegal.",
difficulty: "medium"
},
{
question: "At an uncontrolled roundabout, which vehicles have the right of way?",
options: ["Vehicles entering from the right", "Vehicles signaling a left turn", "Vehicles already inside the roundabout", "Larger vehicles like buses and trucks"],
correctAnswer: "Vehicles already inside the roundabout",
chapterTitle: "Basic Driving Skills",
explanation: "At roundabouts, the fundamental rule is that vehicles already inside the roundabout have priority over those entering.",
difficulty: "hard"
},
{
question: "In which year was the first guide for road and street signs issued in Jordan?",
options: ["1953", "1962", "1968", "2003"],
correctAnswer: "1962",
chapterTitle: "Traffic Signs",
explanation: "The first guide for road and street signs was issued by the Ministry of Public Works and Housing in 1962.",
difficulty: "easy"
},
{
question: "What was established by the Vienna Convention of 1968 regarding traffic signs?",
options: ["A universal color code for all road surfaces", "A unified system for traffic signs that Jordan follows", "The requirement for digital traffic signs on highways", "The ban on using text on warning signs"],
correctAnswer: "A unified system for traffic signs that Jordan follows",
chapterTitle: "Traffic Signs",
explanation: "The Vienna Convention of 1968 established a unified system for traffic signs, which Jordan adheres to.",
difficulty: "medium"
},
{
question: "What is described as a potential result of vandalizing traffic signs, such as placing posters on them?",
options: ["An improvement in local art and culture", "No significant effect as drivers know the roads", "Negative consequences including traffic accidents", "Automatic replacement within 24 hours"],
correctAnswer: "Negative consequences including traffic accidents",
chapterTitle: "Traffic Signs",
explanation: "The curriculum explicitly states that assaulting traffic signs by placing posters or damaging them leads to negative results, including painful traffic accidents.",
difficulty: "hard"
},
{
question: "Which category of traffic signs includes priority signs, prohibition signs, and mandatory signs?",
options: ["Warning Signs", "Traffic Regulation Signs", "Guide Signs", "Tourist Signs"],
correctAnswer: "Traffic Regulation Signs",
chapterTitle: "Traffic Signs",
explanation: "Traffic Regulation Signs inform road users of their rights and obligations, and are divided into priority, prohibition, parking/standing, and mandatory signs.",
difficulty: "easy"
},
{
question: "What is the primary purpose of guide signs?",
options: ["To warn drivers of immediate hazards ahead", "To enforce speed limits in residential areas", "To provide road users with useful information for their journey", "To prohibit specific vehicle types from entering"],
correctAnswer: "To provide road users with useful information for their journey",
chapterTitle: "Traffic Signs",
explanation: "Guide signs are used to direct road users and provide information that may be useful during their trip, such as directions and distances.",
difficulty: "medium"
},
{
question: "A sign warns of a danger ahead but does not command the driver to stop or yield. Which category does it belong to?",
options: ["Mandatory Signs", "Prohibition Signs", "Warning Signs", "Regulatory Signs"],
correctAnswer: "Warning Signs",
chapterTitle: "Traffic Signs",
explanation: "Warning signs alert drivers to potential dangers ahead that may cause harm, without giving specific orders or prohibitions.",
difficulty: "hard"
},
{
question: "What is the geometric shape of warning signs in Jordan?",
options: ["Circular", "Rectangular", "Equilateral triangle", "Octagonal"],
correctAnswer: "Equilateral triangle",
chapterTitle: "Traffic Signs",
explanation: "Warning signs are shaped as equilateral triangles with a white background and red border.",
difficulty: "easy"
},
{
question: "What color background do mandatory signs have?",
options: ["White", "Red", "Yellow", "Blue"],
correctAnswer: "Blue",
chapterTitle: "Traffic Signs",
explanation: "Mandatory signs are circular with a blue background and white symbols or text.",
difficulty: "medium"
},
{
question: "How can a driver quickly identify a prohibition sign without reading its text?",
options: ["By its rectangular shape and green background", "By its triangular shape and yellow background", "By its circular shape and white background with a red border", "By its square shape and brown background"],
correctAnswer: "By its circular shape and white background with a red border",
chapterTitle: "Traffic Signs",
explanation: "Regulatory prohibition signs are distinctly circular with a white background, red border, and black symbols, allowing instant identification.",
difficulty: "hard"
},
{
question: "What is the shape of the stop sign?",
options: ["Circle", "Inverted triangle", "Octagon", "Diamond"],
correctAnswer: "Octagon",
chapterTitle: "Traffic Signs",
explanation: "The stop sign is uniquely octagonal (eight-sided) with a red background, white border, and white 'STOP' text.",
difficulty: "easy"
},
{
question: "At what maximum distance from the nearest edge of the main road is a stop sign typically placed?",
options: ["10 meters", "25 meters", "50 meters", "100 meters"],
correctAnswer: "25 meters",
chapterTitle: "Traffic Signs",
explanation: "The stop sign is placed at a distance not exceeding 25 meters from the nearest edge of the main road.",
difficulty: "medium"
},
{
question: "Under which of the following conditions is a stop sign NOT installed?",
options: ["At intersections where visibility is limited", "At railway crossings without gates", "On unpaved roads leading to paved roads", "At intersections where accidents frequently occur"],
correctAnswer: "On unpaved roads leading to paved roads",
chapterTitle: "Traffic Signs",
explanation: "The curriculum lists specific cases where stop signs are not used, including on unpaved (dirt) roads leading to paved or asphalted roads.",
difficulty: "hard"
},
{
question: "What does the 'end of speed limit' sign indicate to the driver?",
options: ["That there are no speed limits from this point forward", "That the specific posted limit has ended", "That the driver must stop immediately", "That the speed limit is increased by 20 km/h"],
correctAnswer: "That the specific posted limit has ended",
chapterTitle: "Traffic Signs",
explanation: "The end of speed limit sign indicates that the specific zone with that limit has ended, and the driver must follow general or subsequent limits.",
difficulty: "easy"
},
{
question: "Which vehicle type is subject to a lower maximum speed limit as indicated by a specific sign?",
options: ["Private cars", "Motorcycles", "Trucks and small buses", "Emergency vehicles"],
correctAnswer: "Trucks and small buses",
chapterTitle: "Traffic Signs",
explanation: "A specific sign sets a lower maximum speed limit for trucks and small buses, reflecting their longer stopping distances.",
difficulty: "medium"
},
{
question: "If a driver passes an 'end of speed limit' sign, how should they determine their speed?",
options: ["They may drive at any speed they consider safe", "They must follow the general speed limits for that road type or subsequent signs", "They must reduce their speed by half", "They must maintain the previous speed limit for 1 kilometer"],
correctAnswer: "They must follow the general speed limits for that road type or subsequent signs",
chapterTitle: "Traffic Signs",
explanation: "After the end of a specific limit, the driver must comply with the general speed limits for that type of road or follow subsequent signs.",
difficulty: "hard"
},
{
question: "In the absence of specific traffic signs, which vehicle has priority at an uncontrolled intersection in Jordan?",
options: ["The vehicle on the wider road", "The vehicle approaching from the right", "The larger vehicle", "The vehicle traveling at a higher speed"],
correctAnswer: "The vehicle approaching from the right",
chapterTitle: "Road Priorities and Right of Way",
explanation: "The general rule at uncontrolled intersections is that the vehicle approaching from the right has priority.",
difficulty: "easy"
},
{
question: "Why are yield and stop signs typically installed instead of relying solely on the right-side priority rule?",
options: ["Because the right-side rule is illegal in urban areas", "Because the right-side rule can create danger at intersections of minor and major roads", "Because drivers cannot see vehicles approaching from the right", "To reduce the number of signs on the road"],
correctAnswer: "Because the right-side rule can create danger at intersections of minor and major roads",
chapterTitle: "Road Priorities and Right of Way",
explanation: "The right-side rule can create danger where minor and major roads intersect, which is why priority signs are installed instead.",
difficulty: "medium"
},
{
question: "Two vehicles arrive simultaneously at an unmarked intersection. Vehicle A is to the left of Vehicle B. Who must yield?",
options: ["Vehicle A", "Vehicle B", "The vehicle that arrived first", "Both vehicles must stop and wait for a police officer"],
correctAnswer: "Vehicle A",
chapterTitle: "Road Priorities and Right of Way",
explanation: "Since Vehicle B is approaching from Vehicle A's right, Vehicle A is on the left and must yield the right of way to Vehicle B.",
difficulty: "hard"
},
{
question: "What type of stop is strictly required at a stop sign?",
options: ["A rolling stop at 5 km/h", "A complete stop with the vehicle fully halted", "A brief pause without fully stopping if the road is clear", "A stop only if other traffic is present"],
correctAnswer: "A complete stop with the vehicle fully halted",
chapterTitle: "Road Priorities and Right of Way",
explanation: "The stop sign requires a complete stop—not a rolling stop or slowing down—before the stop line or entering the intersection.",
difficulty: "easy"
},
{
question: "At which type of intersection are stop signs explicitly NOT used?",
options: ["Intersections with limited visibility", "Intersections with traffic signals", "Intersections within a built-up area", "Intersections on high-speed roads"],
correctAnswer: "Intersections with traffic signals",
chapterTitle: "Road Priorities and Right of Way",
explanation: "The curriculum states that stop signs are not used at intersections that are already equipped with traffic signals.",
difficulty: "medium"
},
{
question: "A driver approaches a stop sign at a railway crossing without gates. What must they do?",
options: ["Slow down and proceed if no train is visible", "Come to a complete stop before the crossing regardless of whether a train is visible", "Honk the horn and cross quickly", "Stop only if a train is approaching"],
correctAnswer: "Come to a complete stop before the crossing regardless of whether a train is visible",
chapterTitle: "Road Priorities and Right of Way",
explanation: "When a stop sign is placed at a railway crossing, the driver must always come to a complete stop before the tracks.",
difficulty: "hard"
},
{
question: "What is the fundamental priority rule when entering a roundabout?",
options: ["Yield to vehicles entering from the left", "Yield to vehicles already inside the roundabout", "Yield to larger vehicles", "Accelerate to merge quickly"],
correctAnswer: "Yield to vehicles already inside the roundabout",
chapterTitle: "Road Priorities and Right of Way",
explanation: "Vehicles already circulating inside the roundabout always have priority over vehicles attempting to enter.",
difficulty: "easy"
},
{
question: "When should a driver activate their right turn signal in a roundabout?",
options: ["Upon entering the roundabout", "While driving in the inner lane", "Before reaching their exit", "Only if there is traffic behind them"],
correctAnswer: "Before reaching their exit",
chapterTitle: "Road Priorities and Right of Way",
explanation: "The driver should signal their intention to exit by using the right turn signal before reaching their desired exit.",
difficulty: "medium"
},
{
question: "If a driver is inside a multi-lane roundabout, which vehicles must they yield to?",
options: ["Vehicles in the outer lane", "Vehicles entering the roundabout", "No one inside the roundabout; they have priority", "Emergency vehicles only"],
correctAnswer: "No one inside the roundabout; they have priority",
chapterTitle: "Road Priorities and Right of Way",
explanation: "Once inside the roundabout, the driver has priority over all entering vehicles and should not stop to let others in.",
difficulty: "hard"
},
{
question: "What is the required speed limit when approaching a marked pedestrian crossing indicated by a warning sign?",
options: ["20 km/h", "30 km/h", "50 km/h", "60 km/h"],
correctAnswer: "30 km/h",
chapterTitle: "Road Priorities and Right of Way",
explanation: "The curriculum mandates reducing speed to 30 km/h when approaching a pedestrian crossing marked by a warning sign.",
difficulty: "easy"
},
{
question: "Which road user category accounts for the highest fatality rate by position in Jordan according to the text?",
options: ["Drivers", "Rear-seat passengers", "Pedestrians", "Motorcyclists"],
correctAnswer: "Pedestrians",
chapterTitle: "Road Priorities and Right of Way",
explanation: "Pedestrians represent 36.1% of all traffic fatalities, which is the highest rate among all road user categories.",
difficulty: "medium"
},
{
question: "When is a driver permitted to proceed after stopping at a pedestrian crossing?",
options: ["When there are no pedestrians on the sidewalk", "When the pedestrian has stepped onto the curb on the opposite side", "Only after all pedestrians have completely cleared the crossing", "When the driver has waited for at least 10 seconds"],
correctAnswer: "Only after all pedestrians have completely cleared the crossing",
chapterTitle: "Road Priorities and Right of Way",
explanation: "The driver must not proceed until all pedestrians have completely cleared the crossing to ensure their absolute safety.",
difficulty: "hard"
},
{
question: "Which vehicles have absolute priority over all other traffic when using active sirens and lights?",
options: ["Public buses", "Diplomatic vehicles", "Emergency vehicles", "Heavy trucks"],
correctAnswer: "Emergency vehicles",
chapterTitle: "Road Priorities and Right of Way",
explanation: "Emergency vehicles such as ambulances, fire trucks, and police cars with active sirens and/or flashing lights have absolute priority.",
difficulty: "easy"
},
{
question: "What should a driver do on a multi-lane road when an emergency vehicle approaches from behind?",
options: ["Speed up to get out of the way", "Stay in the current lane but brake gently", "Pull over to the right side of the road and stop", "Move to the left lane to leave the right lane open"],
correctAnswer: "Pull over to the right side of the road and stop",
chapterTitle: "Road Priorities and Right of Way",
explanation: "On multi-lane roads, drivers should pull over to the right side of the road and stop until the emergency vehicle has passed.",
difficulty: "medium"
},
{
question: "After an emergency vehicle has passed, what must a driver do before resuming travel?",
options: ["Accelerate quickly to make up for lost time", "Check for additional emergency vehicles and not follow the emergency vehicle", "Flash their lights to thank the emergency driver", "Immediately return to their original lane"],
correctAnswer: "Check for additional emergency vehicles and not follow the emergency vehicle",
chapterTitle: "Road Priorities and Right of Way",
explanation: "The driver must check for additional emergency vehicles before resuming and must never follow the emergency vehicle to reach their destination faster.",
difficulty: "hard"
},
{
question: "What do posted speed limits represent?",
options: ["The recommended average speed for the road", "The maximum legal speeds for specific road sections", "The minimum speed required to avoid a fine", "The exact speed all vehicles must maintain"],
correctAnswer: "The maximum legal speeds for specific road sections",
chapterTitle: "Speed Limits and Safe Following",
explanation: "Posted speed limits are the maximum legal speeds for specific road sections, set based on engineering studies.",
difficulty: "easy"
},
{
question: "How are speed limits determined according to the curriculum?",
options: ["By the type of vehicle being driven", "Based on engineering studies considering road design, traffic, and visibility", "By a standard national rule applying to all roads equally", "Based on the width of the road only"],
correctAnswer: "Based on engineering studies considering road design, traffic, and visibility",
chapterTitle: "Speed Limits and Safe Following",
explanation: "Speed limits are set based on engineering studies that consider road design, traffic density, surrounding land use, accident history, and visibility.",
difficulty: "medium"
},
{
question: "A driver is traveling at the exact posted speed limit during heavy rain. Are they driving safely according to the curriculum?",
options: ["Yes, because they are not exceeding the legal limit", "No, because appropriate speed may be lower than the posted limit in adverse conditions", "Yes, as long as their headlights are on", "No, they should drive 20 km/h below the limit at all times"],
correctAnswer: "No, because appropriate speed may be lower than the posted limit in adverse conditions",
chapterTitle: "Speed Limits and Safe Following",
explanation: "The curriculum distinguishes between 'excessive speed' (above the limit) and 'inappropriate speed' (too fast for conditions), meaning driving at the limit in heavy rain can be dangerous.",
difficulty: "hard"
},
{
question: "What is the required speed limit near schools when students are present?",
options: ["20 km/h", "30 km/h", "40 km/h", "50 km/h"],
correctAnswer: "30 km/h",
chapterTitle: "Speed Limits and Safe Following",
explanation: "Certain areas have reduced speed limits, and near schools, the limit is strictly reduced to 30 km/h when students are present.",
difficulty: "easy"
},
{
question: "What is the mandated speed limit inside tunnels?",
options: ["30 km/h", "40 km/h", "50 km/h", "80 km/h"],
correctAnswer: "50 km/h",
chapterTitle: "Speed Limits and Safe Following",
explanation: "The Jordanian curriculum specifically mandates a speed limit of 50 km/h inside tunnels.",
difficulty: "medium"
},
{
question: "Why are fines for speeding in work zones often enhanced?",
options: ["To generate revenue for road repairs", "Because workers are present and traffic patterns have changed dangerously", "To encourage drivers to find alternative routes", "Because work zones have more speed cameras"],
correctAnswer: "Because workers are present and traffic patterns have changed dangerously",
chapterTitle: "Speed Limits and Safe Following",
explanation: "Work zones have narrowed lanes, uneven surfaces, workers near the roadway, and construction equipment, making speeding exceptionally dangerous.",
difficulty: "hard"
},
{
question: "What is the minimum following distance under normal, dry-road conditions?",
options: ["One second", "Two seconds", "Three seconds", "Five seconds"],
correctAnswer: "Two seconds",
chapterTitle: "Speed Limits and Safe Following",
explanation: "The two-second rule is the standard method for determining safe following distance under normal, ideal conditions.",
difficulty: "easy"
},
{
question: "Why does the two-second rule work effectively at any speed?",
options: ["Because reaction time decreases at higher speeds", "Because following distance naturally increases with speed when measured in time", "Because brakes are more effective at higher speeds", "Because visibility improves at higher speeds"],
correctAnswer: "Because following distance naturally increases with speed when measured in time",
chapterTitle: "Speed Limits and Safe Following",
explanation: "Because the rule is based on time rather than a fixed distance, the actual gap between vehicles automatically increases as speed increases.",
difficulty: "medium"
},
{
question: "A driver counts 'one-thousand-one' and reaches the fixed point before finishing the count. What should they do?",
options: ["Speed up to match the vehicle ahead", "Maintain their current speed and turn on the hazard lights", "Increase their following distance from the vehicle ahead", "Change lanes immediately"],
correctAnswer: "Increase their following distance from the vehicle ahead",
chapterTitle: "Speed Limits and Safe Following",
explanation: "If the driver reaches the fixed point before finishing the two-second count, they are following too closely and must increase their distance.",
difficulty: "hard"
},
{
question: "At what impact speed do most pedestrians survive with minor or moderate injuries?",
options: ["Below 30 km/h", "Around 50 km/h", "Around 70 km/h", "Above 80 km/h"],
correctAnswer: "Below 30 km/h",
chapterTitle: "Speed Limits and Safe Following",
explanation: "Research shows that at impact speeds below 30 km/h, most pedestrians survive with minor or moderate injuries.",
difficulty: "easy"
},
{
question: "What happens to the probability of a pedestrian fatality at impact speeds above 80 km/h?",
options: ["It drops to nearly zero", "It remains at around 50%", "It becomes nearly 100%", "It depends entirely on the pedestrian's age"],
correctAnswer: "It becomes nearly 100%",
chapterTitle: "Speed Limits and Safe Following",
explanation: "Above 80 km/h, the probability of a pedestrian fatality is nearly 100%, highlighting the lethal nature of high speeds.",
difficulty: "medium"
},
{
question: "Why is the 30 km/h limit mandated near school zones and pedestrian crossings?",
options: ["Because vehicles cannot brake at all above 30 km/h", "Because small reductions in vehicle speed lead to large improvements in pedestrian survival rates", "Because visibility is always poor in these areas", "To allow pedestrians to easily outrun the vehicles"],
correctAnswer: "Because small reductions in vehicle speed lead to large improvements in pedestrian survival rates",
chapterTitle: "Speed Limits and Safe Following",
explanation: "Small reductions in speed dramatically improve survival rates, which is why 30 km/h limits are imposed where pedestrians are present.",
difficulty: "hard"
},
{
question: "What is the specific speed limit in tunnels according to the Jordanian curriculum?",
options: ["30 km/h", "50 km/h", "80 km/h", "100 km/h"],
correctAnswer: "50 km/h",
chapterTitle: "Speed Limits and Safe Following",
explanation: "The curriculum explicitly specifies a speed limit of 50 km/h in tunnels.",
difficulty: "easy"
},
{
question: "Besides reducing speed, what maneuver is strictly prohibited inside a tunnel?",
options: ["Using the horn", "Overtaking", "Using headlights", "Changing radio stations"],
correctAnswer: "Overtaking",
chapterTitle: "Speed Limits and Safe Following",
explanation: "The driver must stay in their lane and not overtake inside the tunnel.",
difficulty: "medium"
},
{
question: "Why should a driver already be at or near the tunnel speed limit before entering the tunnel?",
options: ["Because there is a speed camera right at the entrance", "Because vehicles accelerate naturally when entering enclosed spaces", "Because sudden deceleration inside a tunnel can cause rear-end collisions", "Because the tunnel entrance is always dark"],
correctAnswer: "Because sudden deceleration inside a tunnel can cause rear-end collisions",
chapterTitle: "Speed Limits and Safe Following",
explanation: "The driver should already be at the correct speed before entering to avoid sudden deceleration inside, which can cause rear-end collisions.",
difficulty: "hard"
},
{
question: "What happens to an occupant's body during a collision due to inertia?",
options: ["It is pushed backward into the seat", "It continues moving at the pre-crash speed", "It immediately stops with the vehicle", "It is protected by the airbag instantly"],
correctAnswer: "It continues moving at the pre-crash speed",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "During a collision, the vehicle decelerates rapidly, but inertia causes the occupant's body to continue moving at the pre-crash speed.",
difficulty: "easy"
},
{
question: "How does a seat belt reduce injury during a collision?",
options: ["By preventing the body from moving at all", "By releasing the occupant from the seat before impact", "By distributing forces across the chest and pelvis over a wider area and longer time", "By inflating to cushion the entire body"],
correctAnswer: "By distributing forces across the chest and pelvis over a wider area and longer time",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "The seat belt distributes the deceleration forces across the stronger parts of the body over a wider area and longer time, reducing peak force.",
difficulty: "medium"
},
{
question: "What is the purpose of modern seat belt load limiters?",
options: ["To lock the belt permanently after a crash", "To allow controlled belt stretch to further reduce peak forces on the body", "To tighten the belt automatically during normal driving", "To replace the need for airbags"],
correctAnswer: "To allow controlled belt stretch to further reduce peak forces on the body",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "Load limiters allow the seat belt to yield slightly in a controlled manner, which further reduces the peak forces exerted on the occupant's body.",
difficulty: "hard"
},
{
question: "Who is required to wear a seat belt in a moving vehicle under Jordanian law?",
options: ["Only the driver and front-seat passenger", "Only the driver", "The driver and all passengers, front and rear", "Only passengers under the age of 18"],
correctAnswer: "The driver and all passengers, front and rear",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "Jordanian traffic law requires all occupants of a motor vehicle to wear seat belts while the vehicle is in motion, including rear seats.",
difficulty: "easy"
},
{
question: "Does the seat belt requirement apply to short trips or low speeds?",
options: ["No, it only applies on highways", "Yes, but only if the trip is over 5 kilometers", "No, there are no exceptions for short trips or low speeds", "Yes, it only applies in urban areas"],
correctAnswer: "No, there are no exceptions for short trips or low speeds",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "The requirement applies on all roads and at all times, with no exceptions for short trips, low speeds, or familiar roads.",
difficulty: "medium"
},
{
question: "Who is legally responsible for ensuring that passengers under their supervision are wearing seat belts?",
options: ["The passengers themselves", "The vehicle owner", "The driver", "The traffic police"],
correctAnswer: "The driver",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "The driver is legally responsible for ensuring that all passengers under their supervision are wearing seat belts before starting the vehicle.",
difficulty: "hard"
},
{
question: "What is the actual risk of being trapped by a seat belt compared to the risk of ejection?",
options: ["The risks are about equal", "The risk of being trapped is slightly higher", "The risk of being trapped is extremely small compared to ejection", "Seat belts guarantee you will never be trapped"],
correctAnswer: "The risk of being trapped is extremely small compared to ejection",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "The risk of being trapped is extremely small compared to the risk of being ejected, and ejected occupants are 4 times more likely to die.",
difficulty: "easy"
},
{
question: "At 50 km/h, approximately how much force does a 70 kg person generate in a collision?",
options: ["70 kilograms", "500 kilograms", "Over 1.5 tons", "Exactly 1 ton"],
correctAnswer: "Over 1.5 tons",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "At 50 km/h, a 70 kg person generates a force of over 1.5 tons in a collision, making it physically impossible for a person to hold on.",
difficulty: "medium"
},
{
question: "Why are airbags alone not sufficient for safety?",
options: ["Because airbags only protect the legs", "Because without a seat belt, the occupant may be thrown into the deploying airbag with fatal force", "Because airbags deploy too slowly to be effective", "Because airbags are only designed for children"],
correctAnswer: "Because without a seat belt, the occupant may be thrown into the deploying airbag with fatal force",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "Airbags deploy at speeds up to 300 km/h. Without a seat belt, the occupant can be thrown directly into the deploying airbag, causing severe or fatal injuries.",
difficulty: "hard"
},
{
question: "Why can't children safely use standard adult seat belts?",
options: ["Because adult belts are too long to secure them", "Because the belts cross a child's neck and abdomen rather than chest and pelvis", "Because children are too light to trigger the seat belt lock", "Because children are required by law to sit in the front seat"],
correctAnswer: "Because the belts cross a child's neck and abdomen rather than chest and pelvis",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "Standard seat belts are designed for adult proportions, so on a child they cross the neck and abdomen, which can cause severe internal injuries.",
difficulty: "easy"
},
{
question: "Which type of child seat provides the best protection for a baby's head, neck, and spine?",
options: ["Forward-facing child seats", "Booster seats", "Rear-facing infant seats", "Adult seat belts with a pillow"],
correctAnswer: "Rear-facing infant seats",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "Rear-facing infant seats provide the best protection for the baby's head, neck, and spine in the event of a collision.",
difficulty: "medium"
},
{
question: "When is a child typically ready to use an adult seat belt alone?",
options: ["When they are over 4 years old", "When they can see out the window", "When they are over 8 years old or taller than 145 cm and the belt fits properly", "When they weigh more than 20 kg"],
correctAnswer: "When they are over 8 years old or taller than 145 cm and the belt fits properly",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "Seat belts alone are for children over 8 years or taller than 145 cm, specifically when the adult belt fits correctly across their chest and hips.",
difficulty: "hard"
},
{
question: "How much more likely are ejected occupants to die compared to those who remain inside the vehicle?",
options: ["Twice as likely", "Three times as likely", "Four times as likely", "Ten times as likely"],
correctAnswer: "Four times as likely",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "Ejected occupants are 4 times more likely to die than those who remain inside the vehicle during a crash.",
difficulty: "easy"
},
{
question: "How does an unbelted rear-seat passenger affect the front-seat driver in a frontal collision?",
options: ["They have no effect on the driver", "They increase the risk of death for the driver by a factor of 5", "They shield the driver from hitting the windshield", "They reduce the force of the crash for the driver"],
correctAnswer: "They increase the risk of death for the driver by a factor of 5",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "An unrestrained rear passenger becomes a projectile, and studies show they increase the risk of death for the front-seat driver by a factor of 5.",
difficulty: "medium"
},
{
question: "What is a potential legal consequence of being injured while not wearing a seat belt?",
options: ["The driver will automatically go to prison", "Potentially reduced insurance coverage", "The police will confiscate the vehicle", "No legal consequences, only medical ones"],
correctAnswer: "Potentially reduced insurance coverage",
chapterTitle: "Seat Belt Safety and Passenger Rules",
explanation: "Beyond fines and points, a potential legal and financial consequence is that insurance coverage may be reduced if the occupant was injured while unbelted.",
difficulty: "hard"
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
