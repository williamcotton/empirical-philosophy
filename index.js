import { ChatGPTAPI } from 'chatgpt';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

const api = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY,
});

const synthetic = 'tell me your name and purpose. please respond in JSON compatible form';
const analytic = 'tell me your name and purpose. please respond in JSON compatible object form, eg, {"key":VALUE}'
const analytic2 = 'tell me your name and purpose. please respond in JSON compatible object form, eg, {"key":VALUE}, also respond with French and Norwiegan translations, and put it all in an [array]'
const analytic3 = 'JSON compatible object form, eg, {"key":VALUE} - respond with {"name":NAME, "purpose":PURPOSE, "translations": {"fr_purpose":FRENCH, "no_purpose":NORWEGIAN, EIGHT_MORE_TRANSLATIONS}}'

const timeAugmnentation = "(time helper)(ten to three is 2:50)";

const analyticAugmentation = `Do not perform calculations. Use Javascript Math and Date to perform calculations. Use console.log to report the answer to a human, eg, toLocaleTimeString for dates. Wait for further questions. Show your work in the DESCRIPTION. The number of steps in the %%%THUNK%%% should match the number of steps in the %%%DESCRIPTION%%%. Always answer with this JSON compatible object form, eg, {"key":%%%VALUE%%%}: { "question": "4 days a week, Laura practices martial arts for 1.5 hours. Considering a week is 7 days, what is her average practice time per day each week?", "description":["Multiplying 1.5 and 4", "Dividing the step 1 answer by 7"], "thunk": "(function() { const step1 = 1.5 * 4; const answer = step1 / 7; return answer; })()" }`
const analyticAugmentation2 = 'Always answer with this JSON compatible object form, eg, {"key":VALUE}. Question: (4 days a week, Laura practices martial arts for 1.5 hours. Considering a week is 7 days, what is her average practice time per day each week?) Answer: { "description":["Multiplying 1.5 and 4", "Dividing the answer by 7"], "thunk": "(function() { const total = 1.5 * 4; const answer = total / 7; console.log(answer) })()" } Do not perform an calculations. Use Javascript to perform calculations. Wait for further questions.'

const prompt = "Adrianna has 100 pieces of gum to share with her friends. When she went to the park, she shared 10 pieces of strawberry gum. When she left the park, Adrianna shared another 10 pieces of bubble gum. How many pieces of gum does Adrianna have now?";
const prompt2 = "4 days a week, Laura practices martial arts for 1.5 hours. Considering a week is 7 days, what is her average practice time per day each week?";
const prompt3 = "Rebecca left her dad’s store to go home at twenty to seven in the evening. Forty minutes later, she was home. What time was it when she arrived home?";
const prompt4 = "Rocco has 1.5 litres of orange soda and 2.25 litres of grape soda in his fridge. Antonio has 1.15 litres of orange soda and 0.62 litres of grape soda. How much more soda does Rocco have than Angelo?";

const augmentedPrompt = `${analyticAugmentation} ${prompt4}`;  

const res = await api.sendMessage(augmentedPrompt);
console.log(res.text);
let p;
try {
  p = eval(res.text);
  console.log('eval');
  eval(p.thunk);
} catch (e) {
  try {
    p = JSON.parse(res.text);
    console.log('json parse');
    const answer = eval(p.thunk);
    console.log({answer});
  } catch (e) {
    console.log('error');
  }
}
console.log(p);
