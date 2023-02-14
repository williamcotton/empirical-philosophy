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
  answer: string | number;
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

const data = await solve(openEnded.problems[2], dispatch);

insertData(data);
dispatch({
  type: "answer",
  question: data.problem.question,
  answer: data.solvedProblem.answer,
  correct: data.correct,
});
closeDb();
