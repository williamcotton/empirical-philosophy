import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { ChatGPTAPI } from 'chatgpt';
import wikipedia from 'wikipedia';
import WolframAlphaAPI from 'wolfram-alpha-node';
dotenv.config();

import {
  analyticAugmentation0,
  analyticAugmentation1,
  analyticAugmentationContext,
  analyticAugmentation2,
} from "./analytic-augmentations.js";

const waApi = WolframAlphaAPI(
  process.env.WOLFRAM_ALPHA_API_KEY
);

const api = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY,
  completionParams: {
    model: 'text-davinci-003',
    temperature: 0.7,
  },
});

export function parseResponse(res) {
  let p;
  try {
    p = eval(res.text);
    console.log('eval');
  } catch (e) {
    try {
      p = JSON.parse(res.text);
      console.log('json parse');
    } catch (e) {
      console.log('error');
    }
  }
  return p;
}

async function query({prompt, topic, target, type}) {
  // const [wolfromAlphaQuery, wikipediaSummary] = await Promise.all([
  //   waApi.getFull(prompt),
  //   wikipedia.summary(topic),
  // ]);

  // console.log({wolfromAlphaQuery});
  // console.log(JSON.stringify(wolfromAlphaQuery));
  // if (wolfromAlphaQuery.pods) {
  //   const wolfromAlphaContent = JSON.stringify(wolfromAlphaQuery.pods.map(p => ({[p.title]:p.subpods[0].plaintext})));
  //   console.log({wolfromAlphaContent});
  //   const wolframAlphaQueryPrompt = `Context(${wolfromAlphaContent}) ${prompt}`;
  //   const solvedProblem = await ask(wolframAlphaQueryPrompt, analyticAugmentationContext);
  //   solvedProblem.wolfromAlphaQuery = wolfromAlphaQuery;
  //   const populationOfAlbequerque = solvedProblem.answer;
  //   return {answer: populationOfAlbequerque, solvedProblem};
  // } else {
  //   const wikipediaSummaryContent = wikipediaSummary.extract;
  //   const wikipediaSummaryAugmentedPrompt = `Context(${wikipediaSummaryContent}) ${prompt}`;
  //   const solvedProblem = await ask(wikipediaSummaryAugmentedPrompt, analyticAugmentationContext);
  //   solvedProblem.wikipediaSummary = wikipediaSummary;
  //   return {answer: solvedProblem.answer, solvedProblem};
  // }

  const wikipediaSummary = await wikipedia.summary(topic);
  const wikipediaSummaryContent = wikipediaSummary.extract;
  const wikipediaSummaryAugmentedPrompt = `Context(${wikipediaSummaryContent}) ${prompt}`;
  const solvedProblem = await ask(wikipediaSummaryAugmentedPrompt, analyticAugmentationContext);
  solvedProblem.wikipediaSummary = wikipediaSummary;
  const answer = type === 'number' ? (Math.round(parseFloat(solvedProblem.answer)*100)/100) : solvedProblem.answer;
  return {answer, solvedProblem};
}

export async function ask(prompt, augment=analyticAugmentation2) {
  const augmentedPrompt = augment ? `${augment} ${prompt}` : prompt;
  const res = await api.sendMessage(augmentedPrompt);
  res.completionParams = api._completionParams;
  const p = {prompt, augmentedPrompt, res, ...parseResponse(res)};
  const {answer, solvedProblem} = p.thunk ? await eval(p.thunk) : await eval(p.answer);
  p.solvedProblem = solvedProblem;
  p.answer = typeof answer === 'number' ? (Math.round(parseFloat(answer)*100)/100) : answer;
  return p;
}
