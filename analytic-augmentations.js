export const analyticAugmentation0 = `
Wait for further questions. 
%%%ANSWER%%% should be in numerical form without commas (eg, 238572348723). 
Always answer with this JSON compatible object form, eg, { "question": %%%QUESTION%%%, "thunk": %%%ANSWER%%% }
`.replace(/(\r\n|\n|\r)/gm, '');

export const analyticAugmentation1 = `
Do not perform calculations.
Do not compute the answer.
Use Javascript Math and Date to perform calculations.
Always answer with Javascript compatible code in the %%%THUNK%%%, including numerical form without commas (eg, 238572348723).
Always answer with this JSON compatible object form, eg, {"thunk":%%%THUNK%%%} 
Question: 
4 days a week, Laura practices martial arts for 1.5 hours. Considering a week is 7 days, what is her average practice time per day each week?
{
  "thunk": "(async function() { 
    const daysPracticedInAWeek = 4;
    const hoursPracticedInADay = 1.5;
    const daysInAWeek = 7;
    const totalHoursPracticedInAWeek = daysPracticedInAWeek * hoursPracticedInADay; 
    const averagePracticeTimePerDay = totalHoursPracticedInAWeek / daysInAWeek;
    return {answer: averagePracticeTimePerDay, solvedProblem: {}}; 
  })()",
  "answer_en": "Laura practices an average of {answer} hours per day."
} 
Question: 
`.replace(/(\r\n|\n|\r)/gm, '');

const wikiSummaryExample = `
Question: 
What year did Batman first appear in comics?
{
  "thunk": "(async function() {
    const batmanWikipediaSummary = await wikipedia.summary('Batman');
    const batmanWikipediaContent = batmanWikipediaSummary.extract;
    const prompt = 'Context(' + batmanWikipediaContent + ') What year did Batman first appear in comics?';
    const solvedProblem = await ask(prompt, analyticAugmentationContext);
    solvedProblem.wikipediaSummary = batmanWikipediaSummary;
    const yearBatmanFirstAppeared = solvedProblem.answer;
    return {answer: yearBatmanFirstAppeared, solvedProblem};
  })()",
  "answer_en": "Batman first appeared in comics in {answer}."
}
`

export const analyticAugmentationContext = `
Do not perform calculations.
Do not compute the answer.
Use Javascript Math and Date to perform calculations.
Always answer with Javascript compatible code in the %%%THUNK%%%, including numerical form without commas (eg, 238572348723).
Always answer with this JSON compatible object form, eg, {"thunk":%%%THUNK%%%} 
Question: 
Context(%%%Batman Information%%%)
What year did Batman first appear in comics?
{
  "thunk": "(async function() {
    const yearBatmanFirstAppeared = '1939';
    return {answer: yearBatmanFirstAppeared, solvedProblem: {}};
  })()",
  "en": "Batman first appeared in comics in {answer}."
}
Question: 
`.replace(/(\r\n|\n|\r)/gm, '');

export const analyticAugmentation2 = `
Do not perform calculations.
Do not compute the answer.
Use Javascript Math and Date to perform calculations.
Always answer with Javascript compatible code in the %%%THUNK%%%, including numerical form without commas (eg, 238572348723).
Always answer with this JSON compatible object form, eg, {"thunk":%%%THUNK%%%} 
Question:
What is twice the population of Albequerque, New Mexico?
{
  "thunk": "(async function() {
    const populationOfAlbequerque = await query({
      prompt: "What is the population of Albequerque, New Mexico?", 
      topic: "Albequerque, New Mexico",
      target: "population",
      type: "number",
    });
    const populationOfAlbequerqueTimesTwo = populationOfAlbequerque.answer * 2;
    return {answer: populationOfAlbequerqueTimesTwo, solvedProblem: populationOfAlbequerque.solvedProblem};
  })()",
  "en": "The population of Albequerque, New Mexico is {answer}."
}
Question: 
What's the rot13 of "Hello World"?
{
  "thunk": "(async function() { 
    const sentence = 'Hello World';
    const rot13 = sentence.split('').map((char) => {
      const charCode = char.charCodeAt(0);
      if (charCode >= 65 && charCode <= 90) {
        return String.fromCharCode(((charCode - 65 + 13) % 26) + 65);
      } else if (charCode >= 97 && charCode <= 122) {
        return String.fromCharCode(((charCode - 97 + 13) % 26) + 97);
      } else {
        return char;
      }
    }).join('');
    return {answer: rot13, solvedProblem: {}};
  })()",
  "en": "The rot13 of 'Hello World' is {answer}."
} 
Question: 
`.replace(/(\r\n|\n|\r)/gm, '');
