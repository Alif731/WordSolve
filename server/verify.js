const mongoose = require('mongoose');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedData = require('./utils/seeder');
const User = require('./models/User');
const { updateMastery, getNextProblem } = require('./utils/learningEngine');

async function verify() {
  // 1. Setup DB
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('DB Connected');

  // 2. Seed
  await seedData();
  console.log('Seeded');

  // 3. Create a clean student state for adaptive sequencing verification
  let user = await User.create({
    username: 'adaptive_student',
    password: 'password123',
    role: 'student',
    mastery: {},
    zpdNodes: ['foundation_signs'],
  });
  console.log('Initial ZPD:', user.zpdNodes);

  // 4. Verify question sequencing within the same concept.
  let firstProblem = await getNextProblem(user);
  await user.save();
  console.log('First chosen concept:', firstProblem.concept.id);
  assert.equal(firstProblem.concept.id, 'foundation_signs');

  await updateMastery(user, 'foundation_signs', true);
  await user.save();
  user = await User.findById(user._id);

  let secondProblem = await getNextProblem(user);
  await user.save();
  assert.notEqual(String(secondProblem.question._id), String(firstProblem.question._id));
  console.log('Question sequencing verified for foundation_signs.');

  // 5. Simulate Mastery of 'foundation_signs' (Root)
  console.log('Simulating 15 correct attempts for foundation_signs...');
  for (let i = 0; i < 14; i++) {
    await updateMastery(user, 'foundation_signs', true);
  }
  await user.save();
  user = await User.findById(user._id);
  
  // Check Mastery
  let m = user.mastery.get('foundation_signs');
  console.log('Mastery Status (foundation_signs):', m.status);
  assert.equal(m.status, 'mastered');

  // Check Unlock of 'visual_addition'
  const visualAdd = user.mastery.get('visual_addition');
  console.log('Mastery Status (visual_addition):', visualAdd ? visualAdd.status : 'undefined');
  assert.equal(visualAdd?.status, 'unlocked');

  // 6. Simulate Mastery of 'visual_addition'
  console.log('Simulating 15 correct attempts for visual_addition...');
  for (let i = 0; i < 15; i++) {
    await updateMastery(user, 'visual_addition', true);
  }
  await user.save();
  user = await User.findById(user._id);

  m = user.mastery.get('visual_addition');
  console.log('Mastery Status (visual_addition):', m.status);
  assert.equal(m.status, 'mastered');

  // Check Unlock of both child nodes from the same frontier
  const addSingle = user.mastery.get('add_single');
  const visualIcons = user.mastery.get('visual_icons');
  console.log('Mastery Status (add_single):', addSingle ? addSingle.status : 'undefined');
  console.log('Mastery Status (visual_icons):', visualIcons ? visualIcons.status : 'undefined');
  assert.equal(addSingle?.status, 'unlocked');
  assert.equal(visualIcons?.status, 'unlocked');

  const servedConcepts = new Set();
  const thirdProblem = await getNextProblem(user);
  await user.save();
  servedConcepts.add(thirdProblem.concept.id);

  await updateMastery(user, thirdProblem.concept.id, true);
  await user.save();
  user = await User.findById(user._id);

  const fourthProblem = await getNextProblem(user);
  await user.save();
  servedConcepts.add(fourthProblem.concept.id);
  assert.deepEqual([...servedConcepts].sort(), ['add_single', 'visual_icons'].sort());

  console.log('SUCCESS: KL-UCB sequencing, change-point mastery, and graph progression verified.');
  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
