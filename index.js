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
  fibonacci,
} from "./problems.js";

async function solve(problem, dispatch) {
  const solvedProblem = await ask(problem.question, dispatch);
  const correct = solvedProblem.answer === problem.answer || parseFloat(solvedProblem.answer) === parseFloat(problem.answer);
  return {problem, solvedProblem, correct};
}

const dispatch = (action) => console.log(action);

const data = await solve(trivia.problems[11], dispatch);

insertData(data);
dispatch({
  type: 'answer',
  question: data.problem.question,
  answer: data.solvedProblem.answer,
  correct: data.correct,
});
closeDb();
