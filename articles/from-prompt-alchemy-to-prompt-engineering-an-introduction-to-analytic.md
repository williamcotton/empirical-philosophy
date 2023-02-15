A burgeoning lexicon is developing around the use of LLMs like ChatGPT and Stable Diffusion. Prompts, completions, chains, zero-shot, one-shot, many-shot, and fine-tuning are just a few domain specific terms that have evolved quickly over the last two years.

As loosely described in [ChatGPT and the Analytic-Synthetic Distinction](https://www.williamcotton.com/articles/chatgpt-and-the-analytic-synthetic-distinction), there is a useful approach to prompt engineering using the historically informed terminology of analytic augmentation:

An **analytic prompt** contains the facts required for the response in the prompt itself. When responding to an analytic prompt the LLM acts as a **translator**.

A **synthetic prompt** does not contain the facts required for the response in the prompt. When responding to a synthetic prompt the LLM acts as a **synthsizer**.

A translation combines an **source text** and a specified **translation target** in order to generate a **target text**.

```
Source Text: "What is the capital of France?"
Translation Target: "The factual answer to the given question."
Target Text: "Paris is the capital of France."
```

```
Source Text: "Comment t’appelles-tu?"
Translation Target: "French to English."
Target Text: "What is your name?"
```

An LLM operates on an **analytic source prompt** that combines a source text and a specified translation target in order to generate a completion in the form of the target response.

A synthetic prompt that undergoes **analytic augmentation** becomes an analytic prompt. When responding to an analytically augmented prompt the LLM acts as a translator into a structured form of data.

The most basic form of analytic augmentation is a **zeroth-order** analytic augmentation. This is a prompt that contains a **translation target** as described in the prompt itself:

```typescript
export async function askZerothOrder(prompt: string) {
  const res = await chatGpt.sendMessage(prompt);
  const solvedProblem = JSON.parse(res.text);
  return solvedProblem;
}
```

So when we call this function with a prompt like this we get back a JSON object:

```typescript
const prompt = `What is the capital of France? Please respond in JSON form.`;
const solvedProblem = await askZerothOrder(prompt);
console.log(solvedProblem);
// => { capital: 'Paris', country: 'France' }
```

We will probably get back the correct answer but the translation target is vague and and the response is not reliably structured in any way, possibly not even as valid JSON.

So how do we go about encouraging specifically structured reponses?

## First Order Analytic Augmentations

A very basic example uses this template as a prompt:

```typescript
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
```

We can use this to augment a prompt, query an LLM like ChatGPT, and reliably get back a JSON formatted response:

```typescript
export async function askFirstOrder(prompt: string) {
  const augmentedPrompt = `${analyticAugmentationFirstOrder} ${prompt}`;
  const res = await chatGpt.sendMessage(augmentedPrompt);
  const solvedProblem = JSON.parse(res.text);
  return solvedProblem;
}
```

Meaning when we call this function with a prompt like this we get back a JSON object:

```typescript
const prompt = `What is the capital of France?`;
const solvedProblem = await askFirstOrder(prompt);
console.log(solvedProblem);
// => { answer: 'Paris', en: '{answer} is the capital of France.' }
```

In each case, the translation target needs to be specified in the prompt in some manner using **translation target examples** if we wish to have a structured response. Multiple examples tend to increase the reliablity of a response in the specific structure. These have been otherwise described as one-shot and many-shot training examples, with the difference between a one-shot translation target and a many-shot translation target being the number of training examples included in the augmentation.

When this in-context learning is successful this is evidence that the LLM has both **a priori** abilities to translate from English to JSON and **a posteriori** abilities to translate to a specific type of JSON that were derived from these examples.

Here's a translation target example, broken up into the English question, thunk, and English answer:

```
Question:
Are all bachelors unmarried?
```

```typescript
// translation target example thunk
({ answer: "Yes" });
```

```
{answer}, all bachelors are unmarried.
```

The inclusion of an optional **translation target prologue** increases the reliability of the response in the specific structure:

```
Wait for further questions.
%%%ANSWER%%% should be in numerical form without commas (eg, 238572348723).
Always answer with this JSON compatible object form, eg, { "thunk": %%%ANSWER%%% }
```

Consisting of what can best be entertainingly described as alchemical incantations, these are designed to increase the reliability of the response to conform to the specific structure. They are not required but they are useful enough to warrant studying curated collections found at places like [LangChainHub](https://github.com/hwchase17/langchain-hub/tree/master/prompts).

It seems that careful testing with variable sized LLMs should shed more light on the efficacy of these incantations as this would begin to deliminate a priori and a posteriori abilities of both translation and synthesis.

## Second Order Analytic Augmentations

The next level replaces our JSON parser with a Javascript evaluator so we'll need to translate our thunk into self-executing Javascript:

```typescript
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
`.replace(/(\r\n|\n|\r)/gm, "");
```

The next level replaces our JSON parser with a Javascript evaluator so we'll need to translate our thunk into self-executing Javascript:

```typescript
export async function askSecondOrder(prompt: string) {
  const augmentedPrompt = `${analyticAugmentationSecondOrder} ${prompt}`;
  const res = await chatGpt.sendMessage(augmentedPrompt);
  const solvedProblem = JSON.parse(res.text);
  const evaluatedThunk = await eval(solvedProblem.thunk);
  evaluatedThunk.en_answer = evaluatedThunk.en.replace(
    "{answer}",
    evaluatedThunk.answer || ""
  );
  return { ...solvedProblem, ...evaluatedThunk };
}
```

We can now have our system answer much more complex questions, like:

```typescript
const prompt = `Answering as [rowInt, colInt], writing custom predictBestMove, getEmptySpaces, minimax and checkWinner functions implemented in the thunk, what is the best tic-tac-toe move for player X on this board: [['X', '_', 'X'], ['_', '_', '_'], ['_', '_', '_']]?`;
const solvedProblem = await askSecondOrder(prompt);
console.log(solvedProblem);
```

It's worth noting that the LLM will not always respond to a prompt with a correct program. The size of an LLM dictates the complexity of the programs it can generate. The way that the question is asked is also very important. The more details provided on how the computations should be performed, the more likely the LLM will be able to generate a correct program.

Here's a real example of a correct response that is worth examining in detail:

```typescript
{
  thunk: (async function (query, dispatch) {
  dispatch({ type: "compute" });
  function predictBestMove(board) {
    let bestScore = -Infinity;
    let bestMove;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === "_") {
          board[i][j] = "X";
          let score = minimax(board, 0, false);
          board[i][j] = "_";
          if (score > bestScore) {
            bestScore = score;
            bestMove = [i, j];
          }
        }
      }
    }
    return bestMove;
  }
  function getEmptySpaces(board) {
    let spaces = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] == "_") {
          spaces.push([i, j]);
        }
      }
    }
    return spaces;
  }
  function minimax(board, depth, isMaximizing) {
    let winner = checkWinner(board);
    if (winner !== null) {
      return score(winner);
    }
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let space of getEmptySpaces(board)) {
        board[space[0]][space[1]] = "X";
        let score = minimax(board, depth + 1, false);
        board[space[0]][space[1]] = "_";
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let space of getEmptySpaces(board)) {
        board[space[0]][space[1]] = "O";
        let score = minimax(board, depth + 1, true);
        board[space[0]][space[1]] = "_";
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  }
  function checkWinner(board) {
    let lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }
  function score(winner) {
    if (winner === "X") {
      return 10;
    } else if (winner === "O") {
      return -10;
    } else {
      return 0;
    }
  }
  const board = [
    ["X", "_", "X"],
    ["_", "_", "_"],
    ["_", "_", "_"],
  ];
  const move = predictBestMove(board);
  dispatch({ type: "compute_response" });
  return { answer: move, solvedProblems: [], computed: true, query: false };
})(query, dispatch),
  en: 'The best move for player X is {answer}.',
  answer: [0, 1],
  en_answer: 'The best move for player X is [0, 1].',
}
```

## Third-Order Analytical Augmentations

This translation target example is a bit more complex. It includes a query to another LLM, and a computation of the answer based on the response to the query.

```
Question:
Context()
What is twice the population of Albequerque, New Mexico?
```

```typescript
// translation target example thunk
async function(query, dispatch) {
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
}
```

This translation target example builds its own function to compute the answer.

```
Question:
Context()
What's the rot13 of "Hello World"?
```

```typescript
// translation target example thunk
async function(query, dispatch) {
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
})(query, dispatch);
```

Just like in the second-order example, we need to evaluate the thunk, but this time in the context of the query, dispatch and toNum functions, which we then merge into the solvedProblem object.

```typescript
export async function ask(
  prompt: string,
  dispatch: Dispatch,
  context: string = "",
  augment: string = analyticAugmentationThirdOrder
) {
  const augmentedPrompt = augment
    ? `${augment} Context(${context})${prompt}`
    : prompt;
  const res = await chatGpt.sendMessage(augmentedPrompt);
  const solvedProblem = JSON.parse(res.text);
  const evaluateStatefulThunk = async ({ query, dispatch, toNum }) =>
    await eval(solvedProblem.thunk);
  const evaluatedThunk = await evaluateStatefulThunk({
    query,
    dispatch,
    toNum,
  });
  evaluatedThunk.en_answer = evaluatedThunk.en.replace(
    "{answer}",
    evaluatedThunk.answer || ""
  );
  return { ...solvedProblem, ...evaluatedThunk };
}
```

Interactions with external state such as computations that are contingent on the results of other natural language queries and the ability to dispatch actions to the query context are all made possible by the third-order analytical augmentations.

```typescript
export async function query({ prompt, topic, target, type, dispatch }) {
  dispatch({ type: "query", prompt, topic, target, target_type: type });
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
```

```typescript
export type Action = {
  type: string;
  [key: string]: any;
};

export type Dispatch = (action: Action) => void;

const dispatch = (action: Action) => console.log(action);
```

When a query is made a call is made to wikipedia to get the context for the query. The context is then passed to the ask function, which is then inserted into the prompt.

However, instead of asking the question in the context of a third-order analytical augmentation, we ask the question in the context of a first-order analytical augmentation, in order to prevent an infinite loop of interactions with an LLM.

If a third-order analytic augmentation results in code that calls further queries of an LLM then the state of executions must be maintained by the caller and eventually halted, either by forcing termination or by using a lower order analytical augmentation.

If a second-order analytic augmentation results in code that loops forever the state of executions must be maintained by the caller and eventually halted by forcing termination.

First-order and zeroth-order analytical augmentations will eventually halt on their own.

```typescript
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
```

```typescript
export function toNum(str: string) {
  if (str.indexOf(".") !== -1) {
    return Math.round(parseFloat(str.replace(/,/g, "")) * 100) / 100;
  }
  return parseInt(str.replace(/,/g, ""), 10);
}
```

Colocation of CPU and GPU hardware and memory used for the pairing of an LLM with a computer will be more performant than other architectures.

Why javascript? Is an LLM any better or worse at using assembly to solve problems?
