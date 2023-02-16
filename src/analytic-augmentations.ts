export const analyticAugmentationFirstOrder = `
Wait for further questions. 
%%%ANSWER%%% should be in numerical form without commas (eg, 238572348723). 
Always answer with this JSON compatible object form, eg, { "thunk": %%%ANSWER%%% }
Question: 
What is the capital of France?
{
  "thunk": "({answer: 'Paris'})",
  "en": "The capital of France is {answer}."
} 
Question: 
Are all bachelors unmarried?
{
  "thunk": "({answer: 'Yes'})",
  "en": "{answer}, all bachelors are unmarried."
} 
Question: 
`.replace(/(\r\n|\n|\r)/gm, "");

export const analyticAugmentationFirstOrderQueryContext = `
Do not perform calculations.
Do not compute the answer.
Use Javascript Math and Date to perform calculations.
Always answer with Javascript compatible code in the %%%THUNK%%%, including numerical form without commas (eg, 238572348723).
Always answer with this JSON compatible object form, eg, {"thunk":%%%THUNK%%%} 
Question: 
Context(Batman first appeared in comics in 1939.)
What year did Batman first appear in comics?
{
  "thunk": "({answer: '1939', analytic: true, computed: false})",
  "en": "Batman first appeared in comics in {answer}."
}
Question: 
Context(France groes wine in the Burgundy region.)
What is the capital of France?
{
  "thunk": "({answer: 'Paris', synthetic: true, computed: false})",
  "en": "The capital of France is {answer}."
}
Question: 
Context(The population of the town was 10,483 at the 2010 census.)
What is the population of Geneseo, NY?
{
  /* Does Context(The population of the town was 10,483 at the 2010 census.) contain 10483? analytic: true */
  "thunk": "({answer: toNum('10483'), analytic: true, computed: false})",
  "en": "The population of Geneseo, NY is {answer}."
}
Context(Dansville is a village in Livingston County, New York)
What is percentage of people who make more than $10,000 a year in Dansville, NY?
{
  /* Does Context(Dansville is a village in Livingston County, New York) contain 34.3? synthetic: true */
  "thunk": "({answer: toNum('34.3'), synthetic: true, computed: false})",
  "en": "The population of Dansville, NY is {answer}."
}
Question:
`.replace(/(\r\n|\n|\r)/gm, "");

export const analyticAugmentationSecondOrder = `
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
    return {answer: averagePracticeTimePerDay, computed: true};
  })()",
  "en": "Laura practices an average of {answer} hours per day."
} 
Question: 
Context() 
What's the rot13 of "Hello World"?
{
  "thunk": "(async function() { 
    const sentence = 'Hello World';
    function compute_rot13(str) {
      return str.split('').map((char) => {
        const charCode = char.charCodeAt(0);
        if (charCode >= 65 && charCode <= 90) {
          return String.fromCharCode(((charCode - 65 + 13) % 26) + 65);
        } else if (charCode >= 97 && charCode <= 122) {
          return String.fromCharCode(((charCode - 97 + 13) % 26) + 97);
        } else {
          return char;
        }
      }).join('');
    }
    const rot13 = compute_rot13(sentence);
    return {answer: rot13, computed: true};
  })()",
  "en": "The rot13 of 'Hello World' is {answer}."
} 
Question: 
`.replace(/(\r\n|\n|\r)/gm, "");

export const analyticAugmentationThirdOrder = `
Do not perform calculations.
Do not compute the answer.
Use standard Javascript Math, Date, String, Array, etc to perform calculations.
Define new functions in the %%%THUNK%%% to perform calculations.
Always answer with Javascript compatible code in the %%%THUNK%%%, including numerical form without commas (eg, 238572348723).
Always answer with this JSON compatible object form, eg, {"thunk":%%%THUNK%%%} 
Question: 
Context() 
What is twice the population of Albequerque, New Mexico?
{
  "thunk": "(async function(query, dispatch) {
    dispatch({type: 'compute'});
    const populationOfAlbequerque = await query({
      prompt: 'What is the population of Albequerque, New Mexico?', 
      topic: 'Albequerque, New Mexico',
      target: 'population',
      type: 'number',
      dispatch,
    });
    const populationOfAlbequerqueTimesTwo = populationOfAlbequerque.answer * 2;
    dispatch({type: 'compute_response'});
    return {answer: populationOfAlbequerqueTimesTwo, solvedProblems: [populationOfAlbequerque.solvedProblems], computed: true, query: true};
  })(query, dispatch)",
  "en": "The population of Albequerque, New Mexico is {answer}."
}
Question: 
Context() 
What's the rot13 of "Hello World"?
{
  "thunk": "(async function(query, dispatch) { 
    dispatch({type: 'compute'});
    const sentence = 'Hello World';
    function compute_rot13(str) {
      return str.split('').map((char) => {
        const charCode = char.charCodeAt(0);
        if (charCode >= 65 && charCode <= 90) {
          return String.fromCharCode(((charCode - 65 + 13) % 26) + 65);
        } else if (charCode >= 97 && charCode <= 122) {
          return String.fromCharCode(((charCode - 97 + 13) % 26) + 97);
        } else {
          return char;
        }
      }).join('');
    }
    const rot13 = compute_rot13(sentence);
    dispatch({type: 'compute_response'});
    return {answer: rot13, solvedProblems: [], computed: true, query: false};
  })(query, dispatch)",
  "en": "The rot13 of 'Hello World' is {answer}."
} 
Question: 
Context() 
A decade ago, Oakville's population was 67,624 people. Now, it is 190% larger. What is Oakville's current population?
{
  "thunk": "(async function(query, dispatch) {
    dispatch({type: 'compute'});
    const populationOfOakvilleTenYearsAgo = 67624;
    const populationOfOakvilleNow = populationOfOakvilleTenYearsAgo * 1.9;
    dispatch({type: 'compute_response'});
    return {answer: populationOfOakvilleNow, solvedProblems: [], computed: true, query: false};
  })(query, dispatch)',
  "en": "The current population of Oakville is {answer} people.',
}
Question: 
`.replace(/(\r\n|\n|\r)/gm, "");
