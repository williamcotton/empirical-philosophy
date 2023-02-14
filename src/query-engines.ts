import * as dotenv from "dotenv";
dotenv.config();

import wikipedia from "wikipedia";
import WolframAlphaAPI from "wolfram-alpha-node";

import { ask } from "./ask.js";
import { analyticAugmentationFirstOrderQueryContext } from "./analytic-augmentations.js";

const wolframAlpha = WolframAlphaAPI(process.env.WOLFRAM_ALPHA_API_KEY);

export async function wikipediaQueryEngine({
  prompt,
  topic,
  target,
  type,
  dispatch,
}) {
  const wikipediaSummary = await wikipedia.summary(topic);
  const wikipediaSummaryContext = wikipediaSummary.extract;
  const solvedProblem = await ask(
    prompt,
    dispatch,
    wikipediaSummaryContext,
    analyticAugmentationFirstOrderQueryContext
  );
  solvedProblem.query = wikipediaSummary;
  dispatch({ type: "query_wikipedia_response", answer: solvedProblem.answer });
  return {
    answer: solvedProblem.answer,
    solvedProblems: [solvedProblem],
    otherSolvedProblems: [],
  };
}

export async function wolframAlphaQueryEngine({
  prompt,
  topic,
  target,
  type,
  dispatch,
}) {
  const wolfromAlphaQuery = await wolframAlpha.getFull(prompt);
  if (wolfromAlphaQuery.pods) {
    const wolfromAlphaContext = JSON.stringify(
      wolfromAlphaQuery.pods.map((p) => ({ [p.title]: p.subpods[0].plaintext }))
    );
    const solvedProblem = await ask(
      prompt,
      dispatch,
      wolfromAlphaContext,
      analyticAugmentationFirstOrderQueryContext
    );
    solvedProblem.query = wolfromAlphaQuery;
    dispatch({ type: "query_wolfram_response", answer: solvedProblem.answer });
    return {
      answer: solvedProblem.answer,
      solvedProblems: [solvedProblem],
      otherSolvedProblems: [],
    };
  }
  return { answer: undefined, solvedProblems: [], otherSolvedProblems: [] };
}
