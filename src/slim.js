import { ChatGPTAPI } from 'chatgpt';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import sqlite3 from 'sqlite3';
dotenv.config();

// Connect to the database or create it if it doesn't exist
const db = new sqlite3.Database('./slim.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the problems database.');
});

// Create a table to store the data
const createTableSql = `
CREATE TABLE IF NOT EXISTS solved_problems (
  question TEXT,
  answer TEXT,
  grade_level TEXT,
  category TEXT,
  operation TEXT,
  solved_prompt TEXT,
  solved_augmented_prompt TEXT,
  solved_res TEXT,
  solved_question TEXT,
  solved_description TEXT,
  solved_thunk TEXT,
  solved_answer TEXT,
  correct INTEGER
);
`;

db.run(createTableSql, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Table created successfully.');
});

const api = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY,
  completionParams: {
    model: 'text-davinci-003',
    temperature: 0.7,
  },
});

const analyticAugmentation1 = `
Question:
 4 days a week, Laura practices martial arts for 1.5 hours. Considering a week is 7 days, what is her average practice time per day each week?

(function() { 
  const dayOfPractice = 4;
  const timeOfPractice = 1.5;
  const daysInWeek = 7;
  const weeklyPractice = dayOfPractice * timeOfPractice;
  const dailyPractice = weeklyPracice /daysInWeek;
  return dailyPractice;
})()

Question:
`;

const addition = {
  "problems": [
    {
      "question": "Ariel was playing basketball. 1 of her shots went in the hoop. 2 of her shots did not go in the hoop. How many shots were there in total?",
      "answer": 3,
      "grade_level": "1st grade, 2nd grade",
      "category": "Addition",
      "goal": 10
    },
    {
      "question": "Adrianna has 10 pieces of gum to share with her friends. There wasn't enough gum for all her friends, so she went to the store to get 3 more pieces of gum. How many pieces of gum does Adrianna have now?",
      "answer": 13,
      "grade_level": "1st grade, 2nd grade",
      "category": "Addition",
      "goal": 20
    },
    {
      "question": "Adrianna has 10 pieces of gum to share with her friends. There wasn't enough gum for all her friends, so she went to the store and got 70 pieces of strawberry gum and 10 pieces of bubble gum. How many pieces of gum does Adrianna have now?",
      "answer": 90,
      "grade_level": "1st grade, 2nd grade",
      "category": "Addition",
      "goal": 100
    },
    {
      "question": "The restaurant has 175 normal chairs and 20 chairs for babies. How many chairs does the restaurant have in total?",
      "answer": 195,
      "grade_level": "1st grade, 2nd grade",
      "category": "Addition",
      "goal": "Slightly over 100"
    },
    {
      "question": "How many cookies did you sell if you sold 320 chocolate cookies and 270 vanilla cookies?",
      "answer": 590,
      "grade_level": "1st grade, 2nd grade",
      "category": "Addition",
      "goal": 1000
    },
    {
      "question": "The hobby store normally sells 10,576 trading cards per month. In June, the hobby store sold 15,498 more trading cards than normal. In total, how many trading cards did the hobby store sell in June?",
      "answer": 26074,
      "grade_level": "1st grade, 2nd grade",
      "category": "Addition",
      "goal": "Over 10,000"
    },
    {
      "question": "Billy had 2 books at home. He went to the library to take out 2 more books. He then bought 1 book. How many books does Billy have now?",
      "answer": 5,
      "grade_level": "1st grade, 2nd grade",
      "category": "Addition",
      "goal": "3 Numbers"
    },
    {
      "question": "Ashley bought a big bag of candy. The bag had 102 blue candies, 100 red candies and 94 green candies. How many candies were there in total?",
      "answer": 296,
      "grade_level": "1st grade, 2nd grade",
      "category": "Addition",
      "goal": "Over 100"
    }
  ]
};

const subtraction = {
  "problems": [
    {
      "question": "There were 3 pizzas in total at the pizza shop. A customer bought 1 pizza. How many pizzas are left?",
      "answer": 2,
      "grade_level": "1st grade, 2nd grade",
      "category": "Subtraction",
      "goal": 10
    },
    {
      "question": "Your friend said she had 11 stickers. When you helped her clean her desk, she only had a total of 10 stickers. How many stickers are missing?",
      "answer": 1,
      "grade_level": "1st grade, 2nd grade",
      "category": "Subtraction",
      "goal": 20
    },
    {
      "question": "Adrianna has 100 pieces of gum to share with her friends. When she went to the park, she shared 10 pieces of strawberry gum. When she left the park, Adrianna shared another 10 pieces of bubble gum. How many pieces of gum does Adrianna have now?",
      "answer": 80,
      "grade_level": "1st grade, 2nd grade",
      "category": "Subtraction",
      "goal": 100
    },
    {
      "question": "Your team scored a total of 123 points. 67 points were scored in the first half. How many were scored in the second half?",
      "answer": 56,
      "grade_level": "1st grade, 2nd grade",
      "category": "Subtraction",
      "goal": "Slightly over 100"
    },
    {
      "question": "Nathan has a big ant farm. He decided to sell some of his ants. He started with 965 ants. He sold 213. How many ants does he have now?",
      "answer": 752,
      "grade_level": "1st grade, 2nd grade",
      "category": "Subtraction",
      "goal": 1000
    },
    {
      "question": "The hobby store normally sells 10,576 trading cards per month. In July, the hobby store sold a total of 20,777 trading cards. How many more trading cards did the hobby store sell in July compared with a normal month?",
      "answer": 10201,
      "grade_level": "1st grade, 2nd grade",
      "category": "Subtraction",
      "goal": "Over 10,000"
    },
    {
      "question": "Charlene had a pack of 35 pencil crayons. She gave 6 to her friend Theresa. She gave 3 to her friend Mandy. How many pencil crayons does Charlene have left?",
      "answer": 26,
      "grade_level": "1st grade, 2nd grade",
      "category": "Subtraction",
      "goal": "3 Numbers"
    },
    {
      "question": "Ashley bought a big bag of candy to share with her friends. In total, there were 296 candies. She gave 105 candies to Marissa. She also gave 86 candies to Kayla. How many candies were left?",
      "answer": 105,
      "grade_level": "1st grade, 2nd grade",
      "category": "Subtraction",
      "goal": "Over 100"
    },
    {
      "question": "The hobby store normally sells 10,576,241 trading cards per month. In July, the hobby store sold a total of 23,223,152 trading cards. How many more trading cards did the hobby store sell in July compared with a normal month?",
      "answer": 12646911,
      "grade_level": "1st grade, 2nd grade",
      "category": "Subtraction",
      "goal": "Over 10,000,000"
    },
  ] 
};

const decimals = {
  "problems": [
    {
      "question": "You have 2.6 grams of yogurt in your bowl and you add another spoonful of 1.3 grams. How much yogurt do you have in total?",
      "answer": 3.9,
      "grade_level": "4th grade, 5th grade",
      "category": "Decimals",
      "operation": "Adding"
    },
    {
      "question": "Gemma had 25.75 grams of frosting to make a cake. She decided to use only 15.5 grams of the frosting. How much frosting does Gemma have left?",
      "answer": 10.25,
      "grade_level": "4th grade, 5th grade",
      "category": "Decimals",
      "operation": "Subtracting"
    },
    {
      "question": "Marshall walks a total of 0.9 kilometres to and from school each day. After 4 days, how many kilometres will he have walked?",
      "answer": 3.6,
      "grade_level": "4th grade, 5th grade",
      "category": "Decimals",
      "operation": "Multiplying with Whole Numbers"
    },
    {
      "question": "To make the Leaning Tower of Pisa from spaghetti, Mrs. Robinson bought 2.5 kilograms of spaghetti. Her students were able to make 10 leaning towers in total. How many kilograms of spaghetti does it take to make 1 leaning tower?",
      "answer": 0.25,
      "grade_level": "4th grade, 5th grade",
      "category": "Decimals",
      "operation": "Dividing by Whole Numbers"
    },
    {
      "question": "Rocco has 1.5 litres of orange soda and 2.25 litres of grape soda in his fridge. Antonio has 1.15 litres of orange soda and 0.62 litres of grape soda. How much more soda does Rocco have than Angelo?",
      "answer": 1.98,
      "grade_level": "4th grade, 5th grade",
      "category": "Decimals",
      "operation": "Mixing Addition and Subtraction"
    },
    {
      "question": "4 days a week, Laura practices martial arts for 1.5 hours. Considering a week is 7 days, what is her average practice time per day each week?",
      "answer": 0.86,
      "grade_level": "4th grade, 5th grade",
      "category": "Decimals",
      "operation": "Mixing Multiplication and Division"
    }
  ]
};

const ratiosAndPercentages = {
  "problems": [
    {
      "question": "The ratio of Jenny's trophies to Meredith's trophies is 7:4. Jenny has 28 trophies. How many does Meredith have?",
      "answer": 16,
      "grade_level": "4th grade, 5th grade, 6th grade",
      "category": "Ratios and Percentages",
      "operation": "Finding a Missing Number"
    },
    {
      "question": "The ratio of Jenny's trophies to Meredith's trophies is 7:4. The difference between the numbers is 12. What are the numbers?",
      "answer": [19, 12],
      "grade_level": "4th grade, 5th grade, 6th grade",
      "category": "Ratios and Percentages",
      "operation": "Finding Missing Numbers"
    },
    {
      "question": "The school's junior band has 10 saxophone players and 20 trumpet players. The school's senior band has 18 saxophone players and 29 trumpet players. Which band has the higher ratio of trumpet to saxophone players?",
      "answer": "Senior Band",
      "grade_level": "4th grade, 5th grade, 6th grade",
      "category": "Ratios and Percentages",
      "operation": "Comparing Ratios"
    },
    {
      "question": "Mary surveyed students in her school to find out what their favourite sports were. Out of 1,200 students, 455 said hockey was their favourite sport. What percentage of students said hockey was their favourite sport?",
      "answer": 0.38,
      "grade_level": "4th grade, 5th grade, 6th grade",
      "category": "Ratios and Percentages",
      "operation": "Determining Percentages"
    },
    {
      "question": "A decade ago, Oakville's population was 67,624 people. Now, it is 190% larger. What is Oakville's current population?",
      "answer": 199168,
      "grade_level": "4th grade, 5th grade, 6th grade",
      "category": "Ratios and Percentages",
      "operation": "Determining Percent of Change"
    },
    {
      "question": "At the ice skate rental stand, 60% of 120 skates are for boys. If the rest of the skates are for girls, how many are there?",
      "answer": 48,
      "grade_level": "4th grade, 5th grade, 6th grade",
      "category": "Ratios and Percentages",
      "operation": "Determining Percents of Numbers"
    },
    {
      "question": "For 4 weeks, William volunteered as a helper for swimming classes. The first week, he volunteered for 8 hours. He volunteered for 12 hours in the second week, and another 12 hours in the third week. The fourth week, he volunteered for 9 hours. For how many hours did he volunteer per week, on average?",
      "answer": 11,
      "grade_level": "4th grade, 5th grade, 6th grade",
      "category": "Ratios and Percentages",
      "operation": "Calculating Averages"
    }
  ]
}

const probabilityDataRelationships = {
  "problems": [
    {
      "question": "John wants to know his class's favourite TV show, so he surveys all of the boys. Will the sample be representative or biased?",
      "answer": "biased",
      "grade_level": "4th grade, 5th grade, 6th grade, 7th grade",
      "category": "Probability and Data Relationships",
      "operation": "Understanding the Premise of Probability"
    },
    {
      "question": "The faces on a fair number die are labelled 1, 2, 3, 4, 5 and 6. You roll the die 12 times. How many times should you expect to roll a 1?",
      "answer": 2,
      "grade_level": "4th grade, 5th grade, 6th grade, 7th grade",
      "category": "Probability and Data Relationships",
      "operation": "Understanding Tangible Probability"
    },
    {
      "question": "The numbers 1 to 50 are in a hat. If the probability of drawing an even number is 25/50, what is the probability of NOT drawing an even number? Express this probability as a fraction.",
      "answer": "1/2",
      "grade_level": "4th grade, 5th grade, 6th grade, 7th grade",
      "category": "Probability and Data Relationships",
      "operation": "Exploring Complementary Events"
    },
    {
      "question": "A pizza shop has recently sold 15 pizzas. 5 of those pizzas were pepperoni. Answering with a fraction, what is the experimental probability that he next pizza will be pepperoni?",
      "answer": "1/3",
      "grade_level": "4th grade, 5th grade, 6th grade, 7th grade",
      "category": "Probability and Data Relationships",
      "operation": "Exploring Experimental Probability"
    },
    {
      "question": "Maurita and Felice each take 4 tests. Here are the results of Maurita's 4 tests: 4, 4, 4, 4. Here are the results for 3 of Felice's 4 tests: 3, 3, 3. If Maurita's mean for the 4 tests is 1 point higher than Felice's, what's the score of Felice's 4th test?",
      "answer": 4,
      "grade_level": "4th grade, 5th grade, 6th grade, 7th grade",
      "category": "Probability and Data Relationships",
      "operation": "Introducing Data Relationships"
    },
    {
      "question": "Store A is selling 7 pounds of bananas for $7.00. Store B is selling 3 pounds of bananas for $6.00. Which store has the better deal?",
      "answer": "Store B",
      "grade_level": "4th grade, 5th grade, 6th grade, 7th grade",
      "category": "Probability and Data Relationships",
      "operation": "Introducing Proportional Relationships"
    },
  ]
};

const multiplication = {
  "problems": [
    {
      "question": "Adrianna needs to cut a pan of brownies into pieces. She cuts 6 even columns and 3 even rows into the pan. How many brownies does she have?",
      "answer": 18,
      "grade_level": "2nd grade, 3rd grade",
      "category": "Multiplication",
      "operation": "Multiplying 1-Digit Integers"
    },
    {
      "question": "A movie theatre has 25 rows of seats with 20 seats in each row. How many seats are there in total?",
      "answer": 500,
      "grade_level": "2nd grade, 3rd grade",
      "category": "Multiplication",
      "operation": "Multiplying 2-Digit Integers"
    },
    {
      "question": "A clothing company has 4 different kinds of sweatshirts. Each year, the company makes 60,000 of each kind of sweatshirt. How many sweatshirts does the company make each year?",
      "answer": 240000,
      "grade_level": "2nd grade, 3rd grade",
      "category": "Multiplication",
      "operation": "Multiplying Integers Ending with 0"
    },
    {
      "question": "A bricklayer stacks bricks in 2 rows, with 10 bricks in each row. On top of each row, there is a stack of 6 bricks. How many bricks are there in total?",
      "answer": 32,
      "grade_level": "2nd grade, 3rd grade",
      "category": "Multiplication",
      "operation": "Multiplying 3 Integers"
    },
    {
      "question": "Cayley earns $5 an hour by delivering newspapers. She delivers newspapers 3 days each week, for 4 hours at a time. After delivering newspapers for 8 weeks, how much money will Cayley earn?",
      "answer": 480,
      "grade_level": "2nd grade, 3rd grade",
      "category": "Multiplication",
      "operation": "Multiplying 4 Integers"
    }
  ]
};

const division = {
  "problems": [
    {
      "question": "If you have 4 pieces of candy split evenly into 2 bags, how many pieces of candy are in each bag?",
      "answer": 2,
      "grade_level": "3rd grade, 4th grade, 5th grade",
      "category": "Division",
      "operation": "Dividing 1-Digit Integers"
    },
    {
      "question": "If you have 80 tickets for the fair and each ride costs 5 tickets, how many rides can you go on?",
      "answer": 16,
      "grade_level": "3rd grade, 4th grade, 5th grade",
      "category": "Division",
      "operation": "Dividing 2-Digit Integers"
    },
    {
      "question": "The school has $20,000 to buy new computer equipment. If each piece of equipment costs $50, how many pieces can the school buy in total?",
      "answer": 400,
      "grade_level": "3rd grade, 4th grade, 5th grade",
      "category": "Division",
      "operation": "Dividing Numbers Ending with 0"
    },
    {
      "question": "Melissa buys 2 packs of tennis balls for $12 in total. All together, there are 6 tennis balls. How much does 1 pack of tennis balls cost? How much does 1 tennis ball cost?",
      "answer": {
        "pack_of_tennis_balls": 6,
        "one_tennis_ball": 1
      },
      "grade_level": "3rd grade, 4th grade, 5th grade",
      "category": "Division",
      "operation": "Dividing 3 Integers"
    },
    {
      "question": "An Italian restaurant receives a shipment of 86 veal cutlets. If it takes 3 cutlets to make a dish, how many cutlets will the restaurant have left over after making as many dishes as possible?",
      "answer": 2,
      "grade_level": "3rd grade, 4th grade, 5th grade",
      "category": "Division",
      "operation": "Interpreting Remainders"
    }
  ]
};

function parseResponse(res) {
  let p = {};
  p.thunk = res.text;
  return p;
}

async function ask(prompt, augment=analyticAugmentation1) {
  const augmentedPrompt = augment ? `${augment} ${prompt}` : prompt;
  const res = await api.sendMessage(augmentedPrompt);
  res.completionParams = api._completionParams;
  const p = {prompt, augmentedPrompt, res, ...parseResponse(res)};
  console.log(p);
  const rawAnswer = p.thunk ? eval(p.thunk) : eval(p.answer);
  p.answer = typeof rawAnswer === 'number' ? (Math.round(parseFloat(rawAnswer)*100)/100) : rawAnswer;
  return p;
}

async function solve(problem) {
  const solvedProblem = await ask(problem.question);
  const correct = solvedProblem.answer === problem.answer;
  return {problem, solvedProblem, correct};
}

async function insertData(db, data) {
  // Insert data into the table
  db.run(`INSERT INTO solved_problems (question, answer, grade_level, category, operation, solved_prompt, solved_augmented_prompt, solved_res, solved_question, solved_description, solved_thunk, solved_answer, correct)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      data.problem.question,
      data.problem.answer,
      data.problem.grade_level,
      data.problem.category,
      data.problem.operation || '',
      data.solvedProblem.prompt,
      data.solvedProblem.augmentedPrompt,
      JSON.stringify(data.solvedProblem.res),
      data.solvedProblem.question,
      JSON.stringify(data.solvedProblem.description ? data.solvedProblem.description : []),
      data.solvedProblem.thunk,
      data.solvedProblem.answer,
      data.correct ? 1 : 0
    ], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log(`Data has been successfully inserted into the database`);
    });
}

const data = await solve(subtraction.problems[0]);
insertData(db, data);

console.log(data);

// Close the database connection
db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Closed the database connection.');
});
