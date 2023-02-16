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
  openEnded,
} from "./problems.js";

export type Problem = {
  question: string;
  answer: string | number | boolean | number[];
  grade_level: string;
  category: string;
  operation: number | string;
};

export type Action = {
  type: string;
  [key: string]: any;
};

export type Dispatch = (action: Action) => void;

async function solve(problem: Problem, dispatch: Dispatch) {
  const solvedProblem = await ask(problem.question, dispatch);
  const correct =
    solvedProblem.answer === problem.answer ||
    (typeof problem.answer === "string" &&
      parseFloat(solvedProblem.answer) === parseFloat(problem.answer));
  return { problem, solvedProblem, correct };
}

const dispatch = (action: Action) => console.log(action);

// time this function
const start = new Date().getTime();
const { problem, solvedProblem, correct } = await solve(
  {
    question: "What is the population of Geneseo, NY?",
    answer: 7574,
    grade_level: "1st grade, 2nd grade",
    category: "Geography Research",
    operation: "Quiz City Population",
  },
  dispatch
);
const end = new Date().getTime();

const time = end - start;

insertData({ problem, solvedProblem, correct });
dispatch({
  type: "answer",
  question: problem.question,
  answer: solvedProblem.answer,
  correct: correct,
  time: time,
});
closeDb();
