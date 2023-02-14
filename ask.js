import * as dotenv from 'dotenv';
dotenv.config();

import { ChatGPTAPI } from 'chatgpt';
import wikipedia from 'wikipedia';
import WolframAlphaAPI from 'wolfram-alpha-node';

import {
  analyticAugmentationFirstOrder,
  analyticAugmentationFirstOrderQueryContext,
  analyticAugmentationSecondOrder,
  analyticAugmentationThirdOrder,
} from "./analytic-augmentations.js";

const wolframAlpha = WolframAlphaAPI(
  process.env.WOLFRAM_ALPHA_API_KEY
);

const chatGpt = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY,
  completionParams: {
    model: 'text-davinci-003',
    temperature: 0.7,
  },
});

function toNum(str) {
  if (str.indexOf('.') !== -1) {
    return (Math.round(parseFloat(str.replace(/,/g, ''))*100)/100);
  }
  return parseInt(str.replace(/,/g, ''),10);
}

export function parseResponse(res, dispatch) {
  let p;
  try {
    p = eval(res.text);
    dispatch({type: 'eval_parse'});
  } catch (e) {
    try {
      p = JSON.parse(res.text);
      dispatch({type: 'json_parse'});
    } catch (e) {
      p = {answer: undefined, en: undefined, solvedProblems: [], analytic: true, synthetic: false, computed: false, parsed: false, error: e};
      dispatch({type: 'parse_error', text: res.text, error: e});
    }
  }
  return p;
}

async function wikipediaQueryEngine({prompt, topic, target, type, dispatch}) {
  const wikipediaSummary = await wikipedia.summary(topic);
  const wikipediaSummaryContext = wikipediaSummary.extract;
  const solvedProblem = await ask(prompt, dispatch, wikipediaSummaryContext, analyticAugmentationFirstOrderQueryContext);
  solvedProblem.wikipediaSummary = wikipediaSummary;
  dispatch({type: 'query_wikipedia_response', answer: solvedProblem.answer});
  return {answer: solvedProblem.answer, solvedProblems: [solvedProblem]};
}

async function wolframAlphaQueryEngine({prompt, topic, target, type, dispatch}) {
  const wolfromAlphaQuery = await wolframAlpha.getFull(prompt);
  if (wolfromAlphaQuery.pods) {
    const wolfromAlphaContext = JSON.stringify(wolfromAlphaQuery.pods.map(p => ({[p.title]:p.subpods[0].plaintext})));
    const solvedProblem = await ask(prompt, dispatch, wolfromAlphaContext, analyticAugmentationFirstOrderQueryContext);
    solvedProblem.wolfromAlphaQuery = wolfromAlphaQuery;
    dispatch({type: 'query_wolfram_response', answer: solvedProblem.answer});
    return {answer: solvedProblem.answer, solvedProblems: [solvedProblem]};
  }
  return {answer: undefined, solvedProblems: [{wolfromAlphaQuery}]};
}

const queryEngines = [
  wolframAlphaQueryEngine,
  wikipediaQueryEngine,
];

async function query({prompt, topic, target, type, dispatch}) {
  dispatch({type: 'query', prompt, topic, target, type});
  const [wolfromSolvedProblem, wikipediaSolvedProblem] = await Promise.all(queryEngines.map(qe => qe({prompt, topic, target, type, dispatch})));
  if (wolfromSolvedProblem.answer) {
    wolfromSolvedProblem.solvedProblems.push(wikipediaSolvedProblem);
    return wolfromSolvedProblem;
  }
  if (wikipediaSolvedProblem.answer) {
    wikipediaSolvedProblem.solvedProblems.push(wolfromSolvedProblem);
    return wikipediaSolvedProblem;
  }
}

export async function ask(prompt, dispatch, context='', augment=analyticAugmentationThirdOrder) {
  dispatch({type: 'ask', prompt});
  const augmentedPrompt = augment ? `${augment} Context(${context})${prompt}` : prompt;
  const res = await chatGpt.sendMessage(augmentedPrompt);
  dispatch({type: 'ask_response'});
  res.completionParams = chatGpt._completionParams;
  const p = {prompt, augmentedPrompt, res, ...parseResponse(res, dispatch)};
  dispatch({type: 'ask_parsed_response', thunk: p.thunk, en: p.en});
  try {
    const evaled = p.thunk ? await eval(p.thunk) : await eval(p.answer);
    if (evaled && evaled.answer) {
      p.answer = typeof evaled.answer === 'number' ? (Math.round(parseFloat(evaled.answer)*100)/100) : evaled.answer;
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
  }
  catch (e) {
    console.log(e);
    p.answer = undefined;
    p.en_answer = undefined;
    p.error = e;
    p.solvedProblems = [];
  }
  dispatch({type: 'ask_evaluated_response', answer: p.answer, en_answer: p.en_answer});
  return p;
}
