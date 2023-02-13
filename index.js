import { insertData, db, closeDb } from "./db.js";
import { ask } from "./ask.js";
import {
  trivia,
  rot13,
  strings,
  addition,
  subtraction,
  decimals,
  ratiosAndPercentages,
  probabilityDataRelationships,
  division,
  multiplication,
} from "./problems.js";

async function solve(problem) {
  const solvedProblem = await ask(problem.question);
  const correct = solvedProblem.answer === problem.answer || parseFloat(solvedProblem.answer) === parseFloat(problem.answer);
  return {problem, solvedProblem, correct};
}

const data = await solve({
  "question": "What is the reverse of the name of the mayor of Chicago?",
  "answer": "toofthgiL iroL",
  "grade_level": "1st grade, 2nd grade",
  "category": "Geography",
  "operation": 60
});

insertData(data);
console.log(data);
closeDb();
