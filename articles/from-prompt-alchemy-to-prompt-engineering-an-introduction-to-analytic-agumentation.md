# From Prompt Alchemy to Prompt Engineering: An Introduction to Analytic Augmentation

A lexicon is developing around the use of LLMs like ChatGPT. Prompts, embeddings, completions, chains, hallucinations, few-shots, and fine-tunings are just a few domain specific terms that describe the building blocks of a burgeoning disciplince.

In practice, prompt engineering can successfully improve the results when using LLMs to answer math questions, solve logic problems, or find out the population of a small town. In other words, certain prompts are more likely to result in correct completions than others. This article will introduce the concept of **analytic augmentation**, a prompt engineering metholodogy that can be used to improve the factual results of LLMs and limit hallucinations.

As described in [ChatGPT and the Analytic-Synthetic Distinction](https://www.williamcotton.com/articles/chatgpt-and-the-analytic-synthetic-distinction), using the historically informed terminology:

An **analytic prompt** contains the facts required for the response in the prompt itself. When responding to an analytic prompt the LLM acts as a **translator**.

A **synthetic prompt** does not contain the facts required for the response in the prompt. When responding to a synthetic prompt the LLM acts as a **synthsizer**.

A translation combines a **source text** and a specified **translation target** in order to generate a **target text**.

```
Source Text: "Comment t’appelles-tu?"
Translation Target: "Translate to English."
Target Text: "What is your name?"
```

An LLM operates on an **analytic source prompt** that combines a source text and a specified translation target in order to generate a completion in the form of the target response.

```
Source Text: "Comment t’appelles-tu?"
Translation Target: "Translate to English and respond in JSON form."
Target Reponse: { en: 'What is your name?' }
```

A synthetic prompt that undergoes **analytic augmentation** becomes an analytic prompt. When responding to an analytically augmented prompt the LLM acts as a translator from a source text into a structured form of data.

The most basic form of analytic augmentation is a **zeroth-order** analytic augmentation. This is a prompt that contains a translation target as described in the prompt itself:

```typescript
export async function askZerothOrder(prompt: string) {
  const res = await chatGpt.sendMessage(prompt);
  const solvedProblem = JSON.parse(res.text);
  return solvedProblem;
}
```

So when we call this function with a prompt like this we get back a JSON object:

### Empirical Sampling

```typescript
const prompt = `What is the capital of France? Respond in JSON form.`;
const solvedProblem = await askZerothOrder(prompt);
console.log(solvedProblem);
// => { capital: 'Paris', country: 'France' }
```

```js
{"capital": "Paris"}
Paris
{"name": "Paris", "country": "France"}
"Paris"
"Paris"
```

We will probably get back the correct answer but the translation target is vague and and the response is not reliably structured in any way, possibly not even as valid JSON. You'll also notice that we are getting back different results each time. This is because we have a non-zero temperature meaning the LLM will possibly produce different reults on each new request.

So how do we go about encouraging a specifically structured reponses?

## First-Order Analytic Augmentations

A first-order analytic augmentation combination prepends the source prompt with a template:

```typescript
export const analyticAugmentationFirstOrder = `
Wait for further questions. 
%%%ANSWER%%% should be in numerical form without commas (eg, 238572348723). 
Always answer with this JSON compatible object form, eg, { "data": %%%ANSWER%%%,"en":%%%EN%%% }.
Question: 
What is the capital of France?
{
  "data": "({answer: 'Paris'})",
  "en": "The capital of France is {answer}."
} 
Question: 
Are all bachelors unmarried?
{
  "data": "({answer: 'Yes'})",
  "en": "{answer}, all bachelors are unmarried."
} 
Question: 
`.replace(/(\r\n|\n|\r)/gm, "");
```

```typescript
export async function askFirstOrder(prompt: string) {
  const augmentedPrompt = `${analyticAugmentationFirstOrder} ${prompt}`;
  const res = await chatGpt.sendMessage(augmentedPrompt);
  const solvedProblem = JSON.parse(res.text);
  const evaluated = eval(solvedProblem.data);
  return { ...evaluated, ...solvedProblem };
}
```

Meaning when we call this function with a prompt like "What is the capital of England?" and reliably get back a properly structured JSON response:

### Empirical Sampling

```typescript
const prompt = `What is the capital of England?`;
const solvedProblem = await askFirstOrder(prompt);
```

```js
{  "data": "({answer: 'London'})",  "en": "The capital of England is {answer}."}
{"data": "({answer: 'London'})", "en": "The capital of England is {answer}."}
{"data": "({answer: 'London'})", "en": "The capital of England is {answer}."}
{  "data": "({answer: 'London'})",  "en": "The capital of England is {answer}."}
{  "data": "({answer: 'London'})",  "en": "The capital of England is {answer}."}
```

In each case, the translation target needs to be specified in the prompt in some manner using at least one **translation example** if we wish to have a structured response. Multiple examples tend to increase the reliablity of a response in the specific structure. These have been otherwise described as one-shot and few-shot training examples, with the difference the number of translation examples included in the augmentation.

When this in-context learning is successful this is evidence that the LLM has both **a priori** abilities to translate from English to JSON and **a posteriori** abilities to translate to a specific type of JSON that were derived from these translation examples. Fine-tuning a model ingrains these derived a posteriori abilities into the model, resulting in an LLM with new priori abilities to translate.

Here's a translation example, broken up into the English question, data, and English answer:

### Translation Example

```
Question:
Are all bachelors unmarried?
```

```typescript
// data
({ answer: "Yes" });
```

```
{answer}, all bachelors are unmarried.
```

The inclusion of an optional **translation prologue** increases the reliability of the response in the specific structure:

```
Wait for further questions.
%%%ANSWER%%% should be in numerical form without commas (eg, 238572348723).
Always answer with this JSON compatible object form, eg, { "data": %%%ANSWER%%% }
```

Perhaps best described as alchemical incantations, these are designed to increase the reliability of the response to conform to the specific structure. They are not required but they are useful enough to warrant studying curated collections found at places like [LangChainHub](https://github.com/hwchase17/langchain-hub/tree/master/prompts).

It seems that careful empirical research with variable sized LLMs should shed more light on the efficacy of these incantations as this would begin to deliminate a priori and a posteriori abilities of both translation and synthesis.

Let's try some more examples:

### Empirical Sampling

```typescript
const prompt = `What is 234 + 942?`;
const solvedProblem = await askFirstOrder(prompt);
```

```js
{ "data": "({answer: '1176'})",  "en": "The answer is {answer}."}
{ "data": "({answer: '1,176'})",  "en": "The answer is {answer}."}
{ "data": "({answer: '1176'})",  "en": "The answer is {answer}."}
{ "data": "({answer: '1176'})",  "en": "The answer is {answer}."}
{ "data": "({answer: '1176'})",  "en": "The answer is {answer}." }
```

Great, the LLM appears to be able to do basic math.

How about with some larger numbers?

### Empirical Sampling

```typescript
const prompt = `What is 23423923 + 94223412?`;
const solvedProblem = await askFirstOrder(prompt);
```

```js
{"data": "({answer: '113656335'})", "en": "The answer is {answer}."}
{"data": "({answer: '113657135'})", "en": "The answer is {answer}."}
{"data": "({answer: '327633135'})", "en": "The answer to 23423923 + 94223412 is {answer}."}
{ "data": "({answer: '117637135'})",  "en": "The answer is {answer}."}
{"data": "({answer: '112846135'})",  "en": "The answer is {answer}."}
```

The actual answer is `117,647,335`. It turns out that math related prompts are synthetic prompts (Kant 1, Frege 0). LLMs can successfully translate a math equation into an answer in certain cases but not in others.

So how do we go about improving the reliability of the response?

## Second-Order Analytic Augmentations

Instead of using the LLM to translate a prompt that includes math _into an answer_ we should have the LLM translate a prompt that includes math _into a thunk that can be evaluated to produce an answer_. This is the foundation of second and higher order analytic augmentation.

Existing examples include [PAL: Program-aided Language Models](https://reasonwithpal.com) and a number of approaches using LangChain such as [LLM Math Chain](https://github.com/hwchase17/langchain-hub/tree/master/prompts/llm_math).

```typescript
export const analyticAugmentationSecondOrder = `
Do not perform calculations.
Do not compute the answer.
Use JavaScript Math and Date to perform calculations.
Always answer with JavaScript compatible code in the %%%THUNK%%%, including numerical form without commas (eg, 238572348723).
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
  })",
  "en": "Laura practices an average of {answer} hours per day."
} 
Question: 
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
  })",
  "en": "The rot13 of 'Hello World' is {answer}."
} 
Question: 
`.replace(/(\r\n|\n|\r)/gm, "");
```

In addition to our JSON parser we will need to evaluate and call the thunk in order to compute our desired answer:

```typescript
export async function askSecondOrder(prompt: string) {
  const augmentedPrompt = `${analyticAugmentationSecondOrder} ${prompt}`;
  const res = await chatGpt.sendMessage(augmentedPrompt);
  const solvedProblem = JSON.parse(res.text);
  const evaluatedThunk = await eval(solvedProblem.thunk)();
  evaluatedThunk.en_answer = evaluatedThunk.en.replace(
    "{answer}",
    evaluatedThunk.answer || ""
  );
  return { ...solvedProblem, ...evaluatedThunk };
}
```

Let's see how this improves our ability to solve math problems:

### Empirical Sampling

```typescript
const prompt = `What is 23423923 + 94223412?`;
const solvedProblem = await askSecondOrder(prompt);
```

```js
{"thunk": "(async function() { return {answer: 23423923 + 94223412, computed: true}; })()", "en": "The answer is {answer}."}
// -> The answer is 117647335.

{"thunk": "(async function() { return {answer: 23423923 + 94223412, computed: true}; })()", "en": "The answer is {answer}."}
// -> The answer is 117647335.

{"thunk": "(async function() { return {answer: 23423923 + 94223412, computed: true}; })()","en": "The answer is {answer}."}
// -> The answer is 117647335.

{"thunk": "(async function() {    const a = 23423923;    const b = 94223412;    const result = a + b;    return {answer: result, computed: true};  })()",  "en": "The result is {answer}."}
// -> The result is 117647335.

{"thunk": "(async function() {    const num1 = 23423923;    const num2 = 94223412;    const answer = num1 + num2;    return {answer: answer, computed: true};  })()",  "en": "{answer}."}
// -> 117647335.

{"thunk": "(async function() {    const numberOne = 23423923;    const numberTwo = 94223412;    const total = numberOne + numberTwo;    return {answer: total, computed: true};  })()",  "en": "The sum of 23423923 and 94223412 is {answer}."}
// -> The sum of 23423923 and 94223412 is 117647335.
```

Great, we're always getting the correct answer now!

We can now have our system try and answer much more complex questions, like making an optimal tic-tac-toe move:

### Empirical Sampling

```typescript
const prompt = `Answering as [rowInt, colInt], writing custom predictBestMove, getEmptySpaces, minimax and checkWinner functions implemented in the thunk, what is the best tic-tac-toe move for player X on this board: [['X', '_', 'X'], ['_', '_', '_'], ['_', '_', '_']]?`;
const solvedProblem = await askSecondOrder(prompt);
```

```
{"thunk": "(async function() { ... })()",  "en": "The best move for player X is {answer}."}
// -> The best move for player X is 0,1.

SyntaxError: Unexpected end of input

{"thunk": "(async function() { ... })()",  "en": "The best move for player X is {answer}."}
// -> The best move for player X is 0,1.

{"thunk": "(async function() { ... })()",  "en": "The best move for player X is [{answer[0]}, {answer[1]}]."}
// -> The best move for player X is [0, 1].

{"thunk": "(async function() { ... })()",  "en": "The best move for player X is [{answer}]."}
// -> The best move for player X is [0,1].

```

```
4/5 voted for [0, 1]
1/5 voted for undefined due to SyntaxError
```

It's worth noting that the LLM will not always respond to a prompt with a correct program. The size of an LLM dictates the complexity of the programs it can generate. The way that the question is asked is also very important. The more details provided on how the computations should be performed, the more likely the LLM will be able to generate a correct program.

In addition, setting a non-zero temperature will result in multiple solutions. This can be beneficial because a temperature of 0 can sometimes return a completion with syntax or logic errors. The technique of **sample-and-vote**, setting a higher temperature and sampling a number of solutions and having a simple voting mechanism, will result in more consistent results. In the above we sampling we can see that 4/5 solutions had the same answer.

Here's a real example of a correct response with some syntax highlighting that is worth examining in detail:

### Sample Thunk

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

You'll notice that we had to provide a lot of details about how to use minmax in a tic-tac-toe context in the prompt to get the LLM to generate a correct program.

This type of leading question is known as **chain-of-thought** prompting. A similar methodology is applied to the translation examples themselves in that the variable names and computational steps are very explicit and simple. This would be the opposite approach of what is colloquially known as "code golf".

It took a number of incorrect prompt attempts to get this correct:

```
Answering as [rowInt, colInt], using minimax you implement, what is the best tic-tac-toe move for player X on this board: [['X', '_', 'X'], ['_', '_', '_'], ['_', '_', '_']]?
```

```
Answering as [rowInt, colInt], using a simple and non-exhaustive method implemented in the thunk, what is the best tic-tac-toe move for player X on this board: [['X', '_', 'X'], ['_', '_', '_'], ['_', '_', '_']]?
```

A reasonable prediction is that as an LLM gets larger, it will be able to generate more complex programs with less detailed guidance.

We had some luck asking some simple fact-based questions about the world. Like with math, how will the LLM respond to more detailed questions about the world?

```typescript
const prompt = `What is the population of Geneseo, NY?`;
const solvedProblem = await askFirstOrder(prompt);
```

```js
{"thunk": "(async function() {    const population = 8883;    return {answer: population, computed: true};  })()", "en": "The population of Geneseo, NY is {answer}."}
{"thunk": "(async function() {  const population = 11388;  return {answer: population, computed: true};})()", "en": "The population of Geneseo, NY is {answer}."}
{"thunk": "(async function() {    const population = 8793;    return {answer: population, computed: true};  })()",  "en": "The population of Geneseo, NY is {answer}."}
{"thunk": "(async function() {    const population = 7936;    return {answer: population, computed: true};  })()", "en": "The population of Geneseo, NY is {answer}."}
{"thunk": "(async function() {    const population = await fetch('https://www.zip-codes.com/city/ny-geneseo.asp').then(r => r.text()).then(html => html.match(/Population: <strong>(.*)<\\/strong>/)[1]).catch(e => null);    return {answer: population, computed: true};  })()",  "en": "The population of Geneseo, NY is {answer}."}
```

According to Wikipedia the answer is `10,483`. This is a synthetic prompt, meaning it doesn't contain the required facts in the prompt itself, so the LLM has resorted to synthesizing an answer. However, this last sample is hinting at a better way...

With this in mind, how do we go about improving the reliability of the results?

## Third-Order Analytical Augmentations

A third-order analytical augmentation introduces the ability to translate our source prompt into a computation that can make further calls to the LLM along with a provided context.

Existing examples include [BingChat](https://www.williamcotton.com/articles/bing-third-order), [Toolformer](https://arxiv.org/abs/2302.04761) and [LangChain Agents](https://langchain.readthedocs.io/en/latest/modules/agents/getting_started.html)

We inject stateful dependencies into a parameterized thunk, or pthunk. We could structure this in the same way that this term is used in functional programming but for presentation sake we will just directly call the pthunk and not have the pthunk return a thunk.

This translation example is a bit more complex. It includes a query to another LLM, and a computation of the answer based on the response to the query:

### Translation Example

```
Question:
Context()
What is twice the population of Albequerque, New Mexico?

```

```typescript
// pthunk
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

Like we saw in the second-order augmentation, this translation example builds its own function to compute the answer:

### Translation Example

```
Question:
Context()
What's the rot13 of "Hello World"?
```

```typescript
// pthunk
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
};
```

But we don't always want to require a function or a query, so we include this translation example as well:

### Translation Example

```
Question:
Context()
A decade ago, Oakville's population was 67,624 people. Now, it is 190% larger. What is Oakville's current population?
```

```typescript
// pthunk
async function(query, dispatch) {
    dispatch({type: 'compute'});
    const populationOfOakvilleTenYearsAgo = 67624;
    const populationOfOakvilleNow = populationOfOakvilleTenYearsAgo * 1.9;
    dispatch({type: 'compute_response'});
    return {answer: populationOfOakvilleNow, solvedProblems: [], computed: true, query: false};
  }
```

Just like in the second-order example, we need to evaluate the pthunk, but this time in the context of the query and dispatch functions, which we then merge into the solvedProblem object.

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

  let evaluated;
  if (solvedProblem.data) {
    evaluated = eval(solvedProblem.data);
  } else if (solvedProblem.thunk) {
    evaluated = await eval(solvedProblem.thunk)();
  } else if (solvedProblem.pthunk) {
    evaluated = await eval(solvedProblem.pthunk)(query, dispatch);
  }
  evaluated.en_answer = evaluated.en.replace(
    "{answer}",
    evaluated.answer || ""
  );

  return { ...solvedProblem, ...evaluated };
}
```

#### dispatch

A simple dispatch mechanism that can be used for updating the UI:

```typescript
export type Action = {
  type: string;
  [key: string]: any;
};

export type Dispatch = (action: Action) => void;

const dispatch = (action: Action) => console.log(action);
```

#### query

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

When a query is made a call is made to Wikipedia to get the context for the query. The context is then passed to the ask function, which is then inserted into the prompt.

However, instead of asking the question in the context of a third-order analytical augmentation, we ask the question in the context of a first-order analytical augmentation, in order to prevent an infinite loop of interactions with an LLM.

If a third-order analytic augmentation results in code that calls further queries of an LLM then the state of executions must be maintained by the caller and eventually halted, either by forcing termination or by using a lower order analytical augmentation.

If a second-order analytic augmentation or above results in code that loops forever the state of executions must be maintained by the caller and eventually halted by forcing termination.

First-order and zeroth-order analytical augmentations will halt on their own.

## Returning to First-Order Analytical Augmentations

```typescript
export const analyticAugmentationFirstOrderQueryContext = `
Do not perform calculations.
Do not compute the answer.
Use JavaScript Math and Date to perform calculations.
Always answer with JavaScript compatible code in the %%%DATA%%%, including numerical form without commas (eg, 238572348723).
Always answer with this JSON compatible object form, eg, {"data":%%%DATA%%%} 
Question: 
Context(Batman first appeared in comics in 1939.)
What year did Batman first appear in comics?
{
  "data": "({answer: '1939', analytic: true, computed: false})",
  "en": "Batman first appeared in comics in {answer}."
}
Question: 
Context(France groes wine in the Burgundy region.)
What is the capital of France?
{
  "data": "({answer: 'Paris', synthetic: true, computed: false})",
  "en": "The capital of France is {answer}."
}
Question: 
Context(The population of the town was 10,483 at the 2010 census.)
What is the population of Geneseo, NY?
{
  /* Does Context(The population of the town was 10,483 at the 2010 census.) contain 10483? analytic: true */
  "data": "({answer: toNum('10483'), analytic: true, computed: false})",
  "en": "The population of Geneseo, NY is {answer}."
}
Context(Dansville is a village in Livingston County, New York)
What is percentage of people who make more than $10,000 a year in Dansville, NY?
{
  /* Does Context(Dansville is a village in Livingston County, New York) contain 34.3? synthetic: true */
  "data": "({answer: toNum('34.3'), synthetic: true, computed: false})",
  "en": "The population of Dansville, NY is {answer}."
}
Question:
`.replace(/(\r\n|\n|\r)/gm, "");
```

We're now providing context to aid in the translation. What starts as a synthetic prompt, for example, "What is the population of Geneseo, NY divided by 4?", becomes an analytic prompt through the process of analytic augmentation.

### Empirical Sampling

```typescript
const prompt = `What is the population of Geneseo, NY combined with the population of Rochester, NY, divided by string length of the answer to the question 'What is the capital of France?'?`;
const solvedProblem = await askSecondOrder(prompt);
```

```js
// -> The population of Geneseo, NY combined with the population of Rochester, NY, divided by string length of the answer to the question 'What is the capital of France?' is 44362.2.
// -> The population of Geneseo, NY combined with the population of Rochester, NY, divided by string length of the answer to the question 'What is the capital of France?' is 44362.2.
// -> The population of Geneseo, NY combined with the population of Rochester, NY divided by the string length of the answer to the question 'What is the capital of France?' is 44362.2.
// -> undefined
// -> The population of Geneseo, NY combined with the population of Rochester, NY divided by the string length of the answer to the question 'What is the capital of France?' is 44362.2.
```

```
4/5 voted for 44362.2
1/5 voted for undefined due to SyntaxError
```

### Sample Pthunk

```typescript
async function(query, dispatch) {
  dispatch({type: 'compute'});
  const populationOfGeneseo = await query({
    prompt: 'What is the population of Geneseo, NY?',
    topic: 'Geneseo, NY',
    target: 'population',
    type: 'number',
    dispatch,
  });
  const populationOfRochester = await query({
    prompt: 'What is the population of Rochester, NY?',
    topic: 'Rochester, NY',
    target: 'population',
    type: 'number',
    dispatch,
  });
  const capitalOfFrance = await query({
    prompt: 'What is the capital of France?',
    topic: 'France',
    target: 'capital',
    type: 'string',
    dispatch,
  });
  const populationOfGeneseoPlusRochesterDividedByCapitalOfFranceLength = (populationOfGeneseo.answer + populationOfRochester.answer) / capitalOfFrance.answer.length;
  dispatch({type: 'compute_response'});
  return {answer: populationOfGeneseoPlusRochesterDividedByCapitalOfFranceLength, solvedProblems: [populationOfGeneseo.solvedProblems, populationOfRochester.solvedProblems, capitalOfFrance.solvedProblems], computed: true, query: true};
});
```

In this case it should be clear why we need the LLM before we start adding context to a query. We have no reliable way to search Wikipedia or any other source of stateful information based on the prompt itself as it combines a number of different facts and topics.

What kind of context can we provide before we need the translation abilities of the LLM?

### Embeddings

Coming soon...
