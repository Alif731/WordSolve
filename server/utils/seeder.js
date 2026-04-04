const Concept = require("../models/Concept");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const TeacherSignupCode = require("../models/TeacherSignupCode");

const DEFAULT_TEACHER_SIGNUP_CODE = "TEACHER2026";

const ensureTeacherSignupCode = async () => {
  const existingCode = await TeacherSignupCode.findOne({
    code: DEFAULT_TEACHER_SIGNUP_CODE,
  });

  if (!existingCode) {
    await TeacherSignupCode.create({
      code: DEFAULT_TEACHER_SIGNUP_CODE,
      label: "Default teacher signup code",
    });
    console.log("Teacher Sign-Up Code Seeded");
  }
};

const conceptsData = [
  {
    id: "foundation_signs",
    title: "Foundation: Choosing Operations",
    description: "Identify whether to Add, Subtract, Multiply, or Divide.",
    prerequisites: [],
    questions: [
      {
        text: "A box has 7 items. You add 5 more.",
        correctAnswer: "+",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [7, 5],
      },
      {
        text: "A box has 12 items. You add 4 more.",
        correctAnswer: "+",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [12, 4],
      },
      {
        text: "A box has 10 items. You remove 2.",
        correctAnswer: "-",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [10, 2],
      },
      {
        text: "A box has 5 items. You remove 3.",
        correctAnswer: "-",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [5, 3],
      },
      {
        text: "A box has 5 items. You remove 4.",
        correctAnswer: "-",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [5, 4],
      },
      {
        text: "There are 4 boxes with 11 items in each.",
        correctAnswer: "×",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [4, 11],
      },
      {
        text: "44 items are shared into 4 piles.",
        correctAnswer: "÷",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [44, 4],
      },
      {
        text: "22 items are shared into 2 piles.",
        correctAnswer: "÷",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [22, 2],
      },
      {
        text: "A gardener plants 6 rows of 5 flowers.",
        correctAnswer: "×",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [6, 5],
      },
      {
        text: "You have 15 candies and give 5 away.",
        correctAnswer: "-",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [15, 5],
      },
      {
        text: "A shelf has 9 books. You put 9 more.",
        correctAnswer: "+",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [9, 9],
      },
      {
        text: "30 students are split into 6 groups.",
        correctAnswer: "÷",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [30, 6],
      },
      {
        text: "A pack has 8 stickers. You buy 4 packs.",
        correctAnswer: "×",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [8, 4],
      },
      {
        text: "You had 20 pencils but lost 7.",
        correctAnswer: "-",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [20, 7],
      },
      {
        text: "A team scored 10 points then 5 more.",
        correctAnswer: "+",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [10, 5],
      },
      {
        text: "18 apples are put into 3 baskets equally.",
        correctAnswer: "÷",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [18, 3],
      },
      {
        text: "Each cat eats 2 treats. There are 7 cats.",
        correctAnswer: "×",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [7, 2],
      },
      {
        text: "A bus had 25 people. 5 people got off.",
        correctAnswer: "-",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [25, 5],
      },
      {
        text: "You found 6 shells and then 6 more.",
        correctAnswer: "+",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [6, 6],
      },
      {
        text: "40 cookies are shared among 8 friends.",
        correctAnswer: "÷",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [40, 8],
      },
    ],
  },
  {
    id: "visual_addition",
    title: "Visual Addition",
    description: "Using bar models to visualize addition.",
    prerequisites: ["foundation_signs"],
    questions: [
      {
        text: "Ella has 17 red marbles and 6 blue marbles. How many total?",
        correctAnswer: "23",
        concept: "visual_addition",
        type: "visual",
        difficulty: 1,
        operands: [17, 6],
        visualData: {
          showTotal: true,
          parts: [
            { value: 17, label: "17", color: "#fca5a5" },
            { value: 6, label: "6", color: "#93c5fd" },
          ],
        },
      },
      {
        text: "Liam has 10 stickers. He buys 5 more. How many now?",
        correctAnswer: "15",
        concept: "visual_addition",
        type: "visual",
        difficulty: 1,
        operands: [10, 5],
        visualData: {
          showTotal: true,
          parts: [
            { value: 10, label: "10", color: "#fcd34d" },
            { value: 5, label: "5", color: "#86efac" },
          ],
        },
      },
      {
        text: "Sam has 18 cards. Someone gives them 6 more.",
        correctAnswer: "24",
        concept: "visual_addition",
        type: "visual",
        difficulty: 1,
        operands: [18, 6],
        visualData: {
          showTotal: true,
          parts: [
            { value: 18, label: "18", color: "#fc4d4d" },
            { value: 6, label: "6", color: "#efdc86" },
          ],
        },
      },
      {
        text: "In a class there are 9 boys and 13 girls.",
        correctAnswer: "22",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [9, 13],
        visualData: {
          showTotal: true,
          parts: [
            { value: 9, label: "9", color: "#fd93d4" },
            { value: 13, label: "13", color: "#a5fce6" },
          ],
        },
      },
      {
        text: "A shop had 18 books. They received 3 more.",
        correctAnswer: "21",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [18, 3],
        visualData: {
          showTotal: true,
          parts: [
            { value: 18, label: "18", color: "#E07A5F" },
            { value: 3, label: "3", color: "#F2CC8F" },
          ],
        },
      },
      {
        text: "A baker made 20 cupcakes and then 15 more.",
        correctAnswer: "35",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [20, 15],
        visualData: {
          showTotal: true,
          parts: [
            { value: 20, label: "20", color: "#fca5a5" },
            { value: 15, label: "15", color: "#93c5fd" },
          ],
        },
      },
      {
        text: "Tom has 12 toy cars. His friend gives him 8.",
        correctAnswer: "20",
        concept: "visual_addition",
        type: "visual",
        difficulty: 1,
        operands: [12, 8],
        visualData: {
          showTotal: true,
          parts: [
            { value: 12, label: "12", color: "#fcd34d" },
            { value: 8, label: "8", color: "#86efac" },
          ],
        },
      },
      {
        text: "A tree has 25 red apples and 10 green apples.",
        correctAnswer: "35",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [25, 10],
        visualData: {
          showTotal: true,
          parts: [
            { value: 25, label: "25", color: "#fc4d4d" },
            { value: 10, label: "10", color: "#efdc86" },
          ],
        },
      },
      {
        text: "Anna saved $30 and her brother saved $20.",
        correctAnswer: "50",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [30, 20],
        visualData: {
          showTotal: true,
          parts: [
            { value: 30, label: "30", color: "#fd93d4" },
            { value: 20, label: "20", color: "#a5fce6" },
          ],
        },
      },
      {
        text: "A fisherman caught 14 fish then 7 more.",
        correctAnswer: "21",
        concept: "visual_addition",
        type: "visual",
        difficulty: 1,
        operands: [14, 7],
        visualData: {
          showTotal: true,
          parts: [
            { value: 14, label: "14", color: "#E07A5F" },
            { value: 7, label: "7", color: "#F2CC8F" },
          ],
        },
      },
      {
        text: "There are 11 dogs and 9 cats at the shelter.",
        correctAnswer: "20",
        concept: "visual_addition",
        type: "visual",
        difficulty: 1,
        operands: [11, 9],
        visualData: {
          showTotal: true,
          parts: [
            { value: 11, label: "11", color: "#fca5a5" },
            { value: 9, label: "9", color: "#93c5fd" },
          ],
        },
      },
      {
        text: "A box contains 16 pencils and 4 pens.",
        correctAnswer: "20",
        concept: "visual_addition",
        type: "visual",
        difficulty: 1,
        operands: [16, 4],
        visualData: {
          showTotal: true,
          parts: [
            { value: 16, label: "16", color: "#fcd34d" },
            { value: 4, label: "4", color: "#86efac" },
          ],
        },
      },
      {
        text: "A garden has 12 roses and 18 tulips.",
        correctAnswer: "30",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [12, 18],
        visualData: {
          showTotal: true,
          parts: [
            { value: 12, label: "12", color: "#fc4d4d" },
            { value: 18, label: "18", color: "#efdc86" },
          ],
        },
      },
      {
        text: "A bus had 15 people. 15 more got on.",
        correctAnswer: "30",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [15, 15],
        visualData: {
          showTotal: true,
          parts: [
            { value: 15, label: "15", color: "#fd93d4" },
            { value: 15, label: "15", color: "#a5fce6" },
          ],
        },
      },
      {
        text: "You read 22 pages then 8 more.",
        correctAnswer: "30",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [22, 8],
        visualData: {
          showTotal: true,
          parts: [
            { value: 22, label: "22", color: "#E07A5F" },
            { value: 8, label: "8", color: "#F2CC8F" },
          ],
        },
      },
      {
        text: "A store has 40 blue shirts and 10 red shirts.",
        correctAnswer: "50",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [40, 10],
        visualData: {
          showTotal: true,
          parts: [
            { value: 40, label: "40", color: "#fca5a5" },
            { value: 10, label: "10", color: "#93c5fd" },
          ],
        },
      },
      {
        text: "A farmer has 13 cows and 12 sheep.",
        correctAnswer: "25",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [13, 12],
        visualData: {
          showTotal: true,
          parts: [
            { value: 13, label: "13", color: "#fcd34d" },
            { value: 12, label: "12", color: "#86efac" },
          ],
        },
      },
      {
        text: "You have 19 marbles and find 11 more.",
        correctAnswer: "30",
        concept: "visual_addition",
        type: "visual",
        difficulty: 2,
        operands: [19, 11],
        visualData: {
          showTotal: true,
          parts: [
            { value: 19, label: "19", color: "#fc4d4d" },
            { value: 11, label: "11", color: "#efdc86" },
          ],
        },
      },
      {
        text: "A pond has 7 big frogs and 8 small frogs.",
        correctAnswer: "15",
        concept: "visual_addition",
        type: "visual",
        difficulty: 1,
        operands: [7, 8],
        visualData: {
          showTotal: true,
          parts: [
            { value: 7, label: "7", color: "#fd93d4" },
            { value: 8, label: "8", color: "#a5fce6" },
          ],
        },
      },
      {
        text: "A boy has 14 stickers and buys 6 more.",
        correctAnswer: "20",
        concept: "visual_addition",
        type: "visual",
        difficulty: 1,
        operands: [14, 6],
        visualData: {
          showTotal: true,
          parts: [
            { value: 14, label: "14", color: "#E07A5F" },
            { value: 6, label: "6", color: "#F2CC8F" },
          ],
        },
      },
    ],
  },
  // ====================================================
  // 3. LEVEL: Icon items
  // ====================================================
  {
    id: "visual_icons",
    title: "Match the Operations",
    description: "Match The Following",
    prerequisites: ["visual_addition"],
    questions: [
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 2,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 4, icon: "cat" },
                { count: 2, icon: "cat" },
              ],
              operator: "+",
              matchId: "R1",
            },
            { id: "L2", type: "text", content: "15 - 8", matchId: "R2" }, // Equals 7
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 3, icon: "banana" },
                { count: 3, icon: "banana" },
              ],
              operator: "×",
              matchId: "R3", // Equals 9
            },
            { id: "L4", type: "text", content: "12 ÷ 3", matchId: "R4" }, // Equals 4
          ],
          rightItems: [
            { id: "R3", type: "text", content: "9" },
            { id: "R4", type: "text", content: "4" },
            { id: "R1", type: "text", content: "6" },
            { id: "R5", type: "text", content: "8" }, // Distractor
            { id: "R2", type: "text", content: "7" },
          ],
        },
      },
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 3,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 5, icon: "orange" },
                { count: 3, icon: "orange" },
              ],
              operator: "+",
              matchId: "R1", // Equals 8
            },
            { id: "L2", type: "text", content: "14 - 5", matchId: "R2" }, // Equals 9
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 3, icon: "pencil" },
                { count: 2, icon: "pencil" },
              ],
              operator: "×",
              matchId: "R3", // Equals 6
            },
            { id: "L4", type: "text", content: "16 ÷ 4", matchId: "R4" }, // Equals 4
          ],
          rightItems: [
            { id: "R4", type: "text", content: "4" },
            { id: "R2", type: "text", content: "9" },
            { id: "R5", type: "text", content: "10" }, // Distractor
            { id: "R3", type: "text", content: "6" },
            { id: "R1", type: "text", content: "8" },
          ],
        },
      },
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 3,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 3, icon: "dog" },
                { count: 4, icon: "dog" },
              ],
              operator: "+",
              matchId: "R1", // Equals 7
            },
            { id: "L2", type: "text", content: "20 - 8", matchId: "R2" }, // Equals 12
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 5, icon: "apple" },
                { count: 2, icon: "apple" },
              ],
              operator: "×",
              matchId: "R3", // Equals 10
            },
            { id: "L4", type: "text", content: "15 ÷ 3", matchId: "R4" }, // Equals 5
          ],
          rightItems: [
            { id: "R1", type: "text", content: "7" },
            { id: "R5", type: "text", content: "15" }, // Distractor
            { id: "R3", type: "text", content: "10" },
            { id: "R2", type: "text", content: "12" },
            { id: "R4", type: "text", content: "5" },
          ],
        },
      },
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 4,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 6, icon: "star" },
                { count: 3, icon: "star" },
              ],
              operator: "+",
              matchId: "R1", // Equals 9
            },
            { id: "L2", type: "text", content: "18 - 7", matchId: "R2" }, // Equals 11
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 4, icon: "car" },
                { count: 3, icon: "car" },
              ],
              operator: "×",
              matchId: "R3", // Equals 12
            },
            { id: "L4", type: "text", content: "20 ÷ 5", matchId: "R4" }, // Equals 4
          ],
          rightItems: [
            { id: "R2", type: "text", content: "11" },
            { id: "R1", type: "text", content: "9" },
            { id: "R4", type: "text", content: "4" },
            { id: "R3", type: "text", content: "12" },
            { id: "R5", type: "text", content: "10" }, // Distractor
          ],
        },
      },
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 4,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 2, icon: "banana" },
                { count: 6, icon: "banana" },
              ],
              operator: "+",
              matchId: "R1", // Equals 8
            },
            { id: "L2", type: "text", content: "11 - 4", matchId: "R2" }, // Equals 7
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 5, icon: "pencil" },
                { count: 3, icon: "pencil" },
              ],
              operator: "×",
              matchId: "R3", // Equals 15
            },
            { id: "L4", type: "text", content: "18 ÷ 3", matchId: "R4" }, // Equals 6
          ],
          rightItems: [
            { id: "R3", type: "text", content: "15" },
            { id: "R4", type: "text", content: "6" },
            { id: "R5", type: "text", content: "9" }, // Distractor
            { id: "R1", type: "text", content: "8" },
            { id: "R2", type: "text", content: "7" },
          ],
        },
      },
    ],
  },
  {
    id: "add_single",
    title: "Single Digit Addition",
    description: "Adding numbers from 0 to 9.",
    prerequisites: ["visual_addition"],
    questions: [
      {
        text: "If you have 4 apples and get 2 more, how many?",
        correctAnswer: "6",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [4, 2],
      },
      {
        text: "Raju has 9 pencils. Geeta gives him 3 more.",
        correctAnswer: "12",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [9, 3],
      },
      {
        text: "What is 5 + 4?",
        correctAnswer: "9",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [5, 4],
      },
      {
        text: "3 stickers then 5 more.",
        correctAnswer: "8",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [3, 5],
      },
      {
        text: "What is 7 + 1?",
        correctAnswer: "8",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [7, 1],
      },
      {
        text: "6 balls then 4 more.",
        correctAnswer: "10",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [6, 4],
      },
      {
        text: "What is 2 + 7?",
        correctAnswer: "9",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [2, 7],
      },
      {
        text: "8 cookies then 1 more.",
        correctAnswer: "9",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [8, 1],
      },
      {
        text: "What is 6 + 3?",
        correctAnswer: "9",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [6, 3],
      },
      {
        text: "5 birds then 2 more fly in.",
        correctAnswer: "7",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [5, 2],
      },
      {
        text: "What is 4 + 4?",
        correctAnswer: "8",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [4, 4],
      },
      {
        text: "9 marbles then 0 more.",
        correctAnswer: "9",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [9, 0],
      },
      {
        text: "What is 1 + 6?",
        correctAnswer: "7",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [1, 6],
      },
      {
        text: "3 toys then 3 more.",
        correctAnswer: "6",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [3, 3],
      },
      {
        text: "What is 5 + 5?",
        correctAnswer: "10",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [5, 5],
      },
      {
        text: "7 pencils then 2 more.",
        correctAnswer: "9",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [7, 2],
      },
      {
        text: "What is 8 + 2?",
        correctAnswer: "10",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [8, 2],
      },
      {
        text: "4 roses and 5 lilies.",
        correctAnswer: "9",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [4, 5],
      },
      {
        text: "What is 3 + 6?",
        correctAnswer: "9",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [3, 6],
      },
      {
        text: "2 cats then 1 more.",
        correctAnswer: "3",
        concept: "add_single",
        type: "direct",
        difficulty: 1,
        operands: [2, 1],
      },
    ],
  },
  {
    id: "sub_single",
    title: "Single Digit Subtraction",
    description: "Subtracting numbers from 0 to 9.",
    prerequisites: ["add_single"],
    questions: [
      {
        text: "5 - 2 = ?",
        correctAnswer: "3",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [5, 2],
      },
      {
        text: "9 - 1 = ?",
        correctAnswer: "8",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [9, 1],
      },
      {
        text: "You have 5 candies and eat 5.",
        correctAnswer: "0",
        concept: "sub_single",
        type: "direct",
        difficulty: 2,
        operands: [5, 5],
      },
      {
        text: "What is 8 - 3?",
        correctAnswer: "5",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [8, 3],
      },
      {
        text: "7 stickers then give 4 away.",
        correctAnswer: "3",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [7, 4],
      },
      {
        text: "What is 6 - 0?",
        correctAnswer: "6",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [6, 0],
      },
      {
        text: "9 balls then take 5 out.",
        correctAnswer: "4",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [9, 5],
      },
      {
        text: "What is 4 - 2?",
        correctAnswer: "2",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [4, 2],
      },
      {
        text: "10 cookies then eat 7.",
        correctAnswer: "3",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [10, 7],
      },
      {
        text: "What is 7 - 7?",
        correctAnswer: "0",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [7, 7],
      },
      {
        text: "8 birds then 3 fly away.",
        correctAnswer: "5",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [8, 3],
      },
      {
        text: "What is 5 - 1?",
        correctAnswer: "4",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [5, 1],
      },
      {
        text: "6 marbles then lose 3.",
        correctAnswer: "3",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [6, 3],
      },
      {
        text: "What is 9 - 4?",
        correctAnswer: "5",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [9, 4],
      },
      {
        text: "3 toys then give 1 away.",
        correctAnswer: "2",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [3, 1],
      },
      {
        text: "What is 8 - 8?",
        correctAnswer: "0",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [8, 8],
      },
      {
        text: "7 pencils then lose 2.",
        correctAnswer: "5",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [7, 2],
      },
      {
        text: "What is 10 - 5?",
        correctAnswer: "5",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [10, 5],
      },
      {
        text: "9 flowers then 6 picked.",
        correctAnswer: "3",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [9, 6],
      },
      {
        text: "What is 5 - 4?",
        correctAnswer: "1",
        concept: "sub_single",
        type: "direct",
        difficulty: 1,
        operands: [5, 4],
      },
    ],
  },
  {
    id: "add_double_no_carry",
    title: "Double Digit Addition (No Carry)",
    description: "Adding numbers like 10 + 20.",
    prerequisites: ["add_single"],
    questions: [
      {
        text: "10 + 10 = ?",
        correctAnswer: "20",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [10, 10],
      },
      {
        text: "12 + 5 = ?",
        correctAnswer: "17",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [12, 5],
      },
      {
        text: "20 + 30 = ?",
        correctAnswer: "50",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [20, 30],
      },
      {
        text: "15 + 4 = ?",
        correctAnswer: "19",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [15, 4],
      },
      {
        text: "21 + 8 = ?",
        correctAnswer: "29",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [21, 8],
      },
      {
        text: "40 + 50 = ?",
        correctAnswer: "90",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [40, 50],
      },
      {
        text: "11 + 7 = ?",
        correctAnswer: "18",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [11, 7],
      },
      {
        text: "33 + 6 = ?",
        correctAnswer: "39",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [33, 6],
      },
      {
        text: "10 + 80 = ?",
        correctAnswer: "90",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [10, 80],
      },
      {
        text: "25 + 2 = ?",
        correctAnswer: "27",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [25, 2],
      },
      {
        text: "50 + 40 = ?",
        correctAnswer: "90",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [50, 40],
      },
      {
        text: "14 + 5 = ?",
        correctAnswer: "19",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [14, 5],
      },
      {
        text: "60 + 20 = ?",
        correctAnswer: "80",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [60, 20],
      },
      {
        text: "71 + 3 = ?",
        correctAnswer: "74",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [71, 3],
      },
      {
        text: "10 + 15 = ?",
        correctAnswer: "25",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [10, 15],
      },
      {
        text: "22 + 7 = ?",
        correctAnswer: "29",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [22, 7],
      },
      {
        text: "80 + 10 = ?",
        correctAnswer: "90",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [80, 10],
      },
      {
        text: "13 + 6 = ?",
        correctAnswer: "19",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [13, 6],
      },
      {
        text: "45 + 4 = ?",
        correctAnswer: "49",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [45, 4],
      },
      {
        text: "30 + 30 = ?",
        correctAnswer: "60",
        concept: "add_double_no_carry",
        type: "direct",
        difficulty: 3,
        operands: [30, 30],
      },
    ],
  },
  {
    id: "mixed_ops_basic",
    title: "Basic Mixed Operations",
    description: "Simple addition and subtraction mixed.",
    prerequisites: ["sub_single", "add_double_no_carry"],
    questions: [
      {
        text: "5 + 2 - 1 = ?",
        correctAnswer: "6",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [5, 2, 1],
      },
      {
        text: "10 - 5 + 3 = ?",
        correctAnswer: "8",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [10, 5, 3],
      },
      {
        text: "8 + 2 - 5 = ?",
        correctAnswer: "5",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [8, 2, 5],
      },
      {
        text: "4 + 4 - 2 = ?",
        correctAnswer: "6",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [4, 4, 2],
      },
      {
        text: "9 - 3 + 1 = ?",
        correctAnswer: "7",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [9, 3, 1],
      },
      {
        text: "6 + 3 - 4 = ?",
        correctAnswer: "5",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [6, 3, 4],
      },
      {
        text: "15 - 5 + 2 = ?",
        correctAnswer: "12",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [15, 5, 2],
      },
      {
        text: "7 + 3 - 10 = ?",
        correctAnswer: "0",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [7, 3, 10],
      },
      {
        text: "20 - 10 + 5 = ?",
        correctAnswer: "15",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [20, 10, 5],
      },
      {
        text: "12 + 8 - 4 = ?",
        correctAnswer: "16",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [12, 8, 4],
      },
      {
        text: "10 + 10 - 5 = ?",
        correctAnswer: "15",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [10, 10, 5],
      },
      {
        text: "5 - 5 + 5 = ?",
        correctAnswer: "5",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [5, 5, 5],
      },
      {
        text: "14 + 1 - 5 = ?",
        correctAnswer: "10",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [14, 1, 5],
      },
      {
        text: "8 - 2 + 6 = ?",
        correctAnswer: "12",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [8, 2, 6],
      },
      {
        text: "11 + 9 - 10 = ?",
        correctAnswer: "10",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [11, 9, 10],
      },
      {
        text: "7 - 2 + 4 = ?",
        correctAnswer: "9",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [7, 2, 4],
      },
      {
        text: "18 - 8 + 3 = ?",
        correctAnswer: "13",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [18, 8, 3],
      },
      {
        text: "6 + 6 - 2 = ?",
        correctAnswer: "10",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [6, 6, 2],
      },
      {
        text: "9 + 1 - 5 = ?",
        correctAnswer: "5",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [9, 1, 5],
      },
      {
        text: "20 - 5 + 10 = ?",
        correctAnswer: "25",
        concept: "mixed_ops_basic",
        type: "algebraic",
        difficulty: 4,
        operands: [20, 5, 10],
      },
    ],
  },
];

// --------------------------------------------------------- test -------------------------------------------------------
// seedData.js

// const seedData = async () => {
//   try {
//     const count = await Concept.countDocuments();
//     if (count > 0) {
//       const teacherExists = await User.findOne({ username: "teacher1" });
//       if (!teacherExists) {
//         await User.create({
//           username: "teacher1",
//           password: "password123",
//           role: "teacher",
//           mastery: {},
//           zpdNodes: [],
//           avatar: "beam",
//           streak: 0,
//         });
//         console.log("Teacher User Seeded");
//       }
//       await ensureTeacherSignupCode();
//       return;
//     }

//     await Concept.deleteMany({});
//     await User.deleteMany({});
//     await Attempt.deleteMany({});
//     await TeacherSignupCode.deleteMany({});

//     await Concept.insertMany(conceptsData);
//     console.log("Concepts Seeded");

//     const testUser = new User({
//       username: "student1",
//       password: "password123", // Pre-save hook will hash this
//       role: "student",
//       mastery: {},
//       zpdNodes: ["foundation_signs"], // sign selection
//       // zpdNodes: ["visual_addition"], // bar
//       // zpdNodes: ["visual_icons"], // Match the following
//       // zpdNodes: ["add_single"], // normal
//     });

//     // Initialize mastery for root
//     testUser.mastery.set("foundation_signs", {
//       // sign selection
//       // testUser.mastery.set("visual_addition", {
//       // bar
//       // testUser.mastery.set("visual_icons", {
//       // Match the following
//       // testUser.mastery.set("add_single", {
//       // normal
//       status: "unlocked",
//       successCount: 0,
//       streak: 0,
//       attemptCount: 0,
//       lastAttempts: [],
//     });

//     await testUser.save();
//     console.log("Test User Seeded");

//     const teacherUser = new User({
//       username: "teacher1",
//       password: "password123",
//       role: "teacher",
//       mastery: {},
//       zpdNodes: [],
//       avatar: "beam",
//     });

//     await teacherUser.save();
//     console.log("Teacher User Seeded");

//     await ensureTeacherSignupCode();
//   } catch (error) {
//     console.error("Seeding Error:", error);
//   }
// };
// module.exports = seedData;

// const seedData = async () => {
//   try {
//     await Concept.deleteMany({});
//     await User.deleteMany({});
//     await Attempt.deleteMany({});
//     await TeacherSignupCode.deleteMany({});
//     console.log("Database Wiped Clean");

//     await Concept.insertMany(conceptsData);

//     // 2. This student1 will now be FRESH with a 0 streak
//     const testUser = new User({
//       username: "student1",
//       password: "password123",
//       role: "student",
//       streak: 0, // This is what shows in your top right corner!
//       zpdNodes: ["foundation_signs"],
//       mastery: {
//         foundation_signs: {
//           status: "unlocked",
//           successCount: 0,
//           streak: 0,
//           attemptCount: 0,
//           lastAttempts: [],
//         },
//       },
//     });

//     await testUser.save();
//     console.log("Test User Seeded with Streak: 0");
//     console.log("Test User Seeded Successfully");

//     // 3. CREATE TEACHER
//     const teacherUser = new User({
//       username: "teacher1",
//       password: "password123",
//       role: "teacher",
//       mastery: {},
//       zpdNodes: [],
//       avatar: "beam",
//       streak: 0,
//     });

//     await teacherUser.save();
//     console.log("Teacher User Seeded Successfully");

//     await ensureTeacherSignupCode();
//   } catch (error) {
//     console.error("Seeding Error:", error);
//   }
// };

// module.exports = seedData;

const seedData = async () => {
  try {
    await Concept.deleteMany({});
    await User.deleteMany({});
    await Attempt.deleteMany({});
    await TeacherSignupCode.deleteMany({});
    console.log("Database Wiped Clean");

    await ensureTeacherSignupCode();

    await Concept.insertMany(conceptsData);
    console.log("Concepts Seeded");

    // =========================================================================
    // 🧪 TESTING SWITCHBOARD: Uncomment the concept you want to test
    // =========================================================================

    const testUser = new User({
      username: "student1",
      password: "password123",
      role: "student",
      streak: 0,

      // --- 1. CHOOSE ACTIVE ZPD NODE ---
      zpdNodes: ["foundation_signs"], // Conceptual (Sign selection)
      // zpdNodes: ["visual_addition"], // Visual (Bar model)
      // zpdNodes: ["visual_icons"], // Icons (Match the following)
      // zpdNodes: ["add_single"],      // Direct Input (Normal math)

      mastery: {
        // --- 2. UNCOMMENT MATCHING MASTERY BLOCK ---
        // Conceptual (Sign selection)
        foundation_signs: {
          status: "unlocked",
          successCount: 0,
          attemptCount: 0,
          lastAttempts: [],
        },
        // // Visual (Bar model)
        // visual_addition: {
        //   status: "unlocked",
        //   successCount: 0,
        //   attemptCount: 0,
        //   lastAttempts: [],
        // },
        // // Icons (Match the following)
        // visual_icons: {
        //   status: "unlocked",
        //   successCount: 0,
        //   attemptCount: 0,
        //   lastAttempts: [],
        // },
        // // Direct Input (Normal math)
        // add_single: {
        //   status: "unlocked",
        //   successCount: 0,
        //   attemptCount: 0,
        //   lastAttempts: [],
        // },
      },
    });

    await testUser.save();
    console.log("Test User (student1) Seeded Successfully");

    // =========================================================================

    // 3. CREATE TEACHER
    const teacherUser = new User({
      username: "teacher1",
      password: "password123",
      role: "teacher",
      mastery: {},
      zpdNodes: [],
      avatar: "beam",
      streak: 0,
    });

    await teacherUser.save();
    console.log("Teacher User Seeded Successfully");
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};

module.exports = seedData;
