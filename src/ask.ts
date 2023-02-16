import * as dotenv from "dotenv";
dotenv.config();

import { ChatGPTAPI } from "chatgpt";
import { Dispatch } from "./index.js";
import {
  wolframAlphaQueryEngine,
  wikipediaQueryEngine,
} from "./query-engines.js";

import wordnet from "wordnet";
await wordnet.init();

import {
  analyticAugmentationFirstOrder,
  analyticAugmentationSecondOrder,
  analyticAugmentationThirdOrder,
} from "./analytic-augmentations.js";

export const chatGpt = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY,
  completionParams: {
    model: "text-davinci-003",
    temperature: 0.7,
  },
});

export function toNum(str: string) {
  if (str.indexOf(".") !== -1) {
    return Math.round(parseFloat(str.replace(/,/g, "")) * 100) / 100;
  }
  return parseInt(str.replace(/,/g, ""), 10);
}

export function parseResponse(res, dispatch: Dispatch) {
  let p;
  try {
    p = eval(res.text);
    dispatch({ type: "eval_parse" });
  } catch (e) {
    try {
      p = JSON.parse(res.text);
      dispatch({ type: "json_parse" });
    } catch (e) {
      p = {
        answer: undefined,
        en: undefined,
        solvedProblems: [],
        analytic: true,
        synthetic: false,
        computed: false,
        parsed: false,
        error: e,
      };
      dispatch({ type: "parse_error", text: res.text, error: e });
    }
  }
  return p;
}

export const queryEngines = [wolframAlphaQueryEngine, wikipediaQueryEngine];

export async function query({ prompt, topic, target, type, dispatch }) {
  dispatch({ type: "query", prompt, topic, target, target_type: type });
  const [wolfromSolvedProblem, wikipediaSolvedProblem] = await Promise.all(
    queryEngines.map((qe) => qe({ prompt, topic, target, type, dispatch }))
  );
  if (wolfromSolvedProblem.answer) {
    wolfromSolvedProblem.otherSolvedProblems.push(wikipediaSolvedProblem);
    return wolfromSolvedProblem;
  }
  if (wikipediaSolvedProblem.answer) {
    wikipediaSolvedProblem.otherSolvedProblems.push(wolfromSolvedProblem);
    return wikipediaSolvedProblem;
  }
}

export type SolvedProblem = {
  prompt: string;
  augmentedPrompt: string;
  res: any;
  answer: any;
  en: string;
  en_answer: string;
  thunk: string;
  solvedProblems: any[];
  otherSolvedProblems: any[];
  query: any;
  error: any;
};

export const analyticOrders = [
  "",
  analyticAugmentationFirstOrder,
  analyticAugmentationSecondOrder,
  analyticAugmentationThirdOrder,
];

export async function ask(
  prompt: string,
  dispatch: Dispatch,
  context: string = "",
  augment: string = analyticOrders[2]
): Promise<SolvedProblem> {
  dispatch({ type: "ask", prompt, context, augment });
  const augmentedPrompt = augment
    ? `${augment} Context(${context})${prompt}`
    : prompt;
  const res = await chatGpt.sendMessage(augmentedPrompt);
  dispatch({ type: "ask_response" });
  console.log("\n", prompt, "\n", res.text, "\n");
  // @ts-ignore
  res.completionParams = chatGpt._completionParams;
  const p = { prompt, augmentedPrompt, res, ...parseResponse(res, dispatch) };
  dispatch({ type: "ask_parsed_response", thunk: p.thunk, en: p.en });
  try {
    const evaled = p.thunk ? await eval(p.thunk) : await eval(p.answer);
    if (evaled && evaled.answer) {
      p.answer =
        typeof evaled.answer === "number"
          ? Math.round(parseFloat(evaled.answer) * 100) / 100
          : evaled.answer;
      p.en_answer = p.en.replace("{answer}", p.answer || "");
    } else {
      p.answer = undefined;
      p.en_answer = undefined;
    }
    if (evaled && evaled.solvedProblems) {
      p.solvedProblems = evaled.solvedProblems;
    } else {
      p.solvedProblems = [];
    }
  } catch (e) {
    console.log(e);
    p.answer = undefined;
    p.en_answer = undefined;
    p.error = e;
    p.solvedProblems = [];
  }
  dispatch({
    type: "ask_evaluated_response",
    answer: p.answer,
    en_answer: p.en_answer,
  });
  return p as SolvedProblem;
}
