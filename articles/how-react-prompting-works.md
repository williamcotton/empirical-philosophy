# How ReAct Prompting Works in Detail

If you were to read [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) you might not get the impression that multiple calls to an LLM are made after each successive step.

![Screenshot 2023-05-01 at 1 34 08 PM](https://user-images.githubusercontent.com/13163/235507566-f58bac11-ee78-4409-aaa9-fcfd7639a672.png)

It also isn't very clear just what is being sent to the LLM and what the response looks like.

This article aims to illuminate this process to gain a deeper insight into this approach.

## Canonical Example

As Taken directly from the LangChain documention for [Agents with Chat Models](https://python.langchain.com/en/latest/getting_started/getting_started.html#agents-with-chat-models):

```python
from langchain.agents import load_tools
from langchain.agents import initialize_agent
from langchain.agents import AgentType
from langchain.chat_models import ChatOpenAI
from langchain.llms import OpenAI

# First, let's load the language model we're going to use to control the agent.
chat = ChatOpenAI(temperature=0)

# Next, let's load some tools to use. Note that the `llm-math` tool uses an LLM, so we need to pass that in.
llm = OpenAI(temperature=0)
tools = load_tools(["serpapi", "llm-math"], llm=llm)


# Finally, let's initialize an agent with the tools, the language model, and the type of agent we want to use.
agent = initialize_agent(tools, chat, agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION, verbose=True)

# Now let's test it out!
agent.run("Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?")
```

### 1st call to LLM

The very first action taken is a call to the [OpenAI Chat Completion API](https://platform.openai.com/docs/api-reference/chat/create) with the following arguments:

```python
{
    "messages": [
        {
            "role": "system",
            "content": 'Answer the following questions as best you can. You have access to the following tools:\n\nSearch: A search engine. Useful for when you need to answer questions about current events. Input should be a search query.\nCalculator: Useful for when you need to answer questions about math.\n\nThe way you use the tools is by specifying a json blob.\nSpecifically, this json should have a `action` key (with the name of the tool to use) and a `action_input` key (with the input to the tool going here).\n\nThe only values that should be in the "action" field are: Search, Calculator\n\nThe $JSON_BLOB should only contain a SINGLE action, do NOT return a list of multiple actions. Here is an example of a valid $JSON_BLOB:\n\n```\n{\n  "action": $TOOL_NAME,\n  "action_input": $INPUT\n}\n```\n\nALWAYS use the following format:\n\nQuestion: the input question you must answer\nThought: you should always think about what to do\nAction:\n```\n$JSON_BLOB\n```\nObservation: the result of the action\n... (this Thought/Action/Observation can repeat N times)\nThought: I now know the final answer\nFinal Answer: the final answer to the original input question\n\nBegin! Reminder to always use the exact characters `Final Answer` when responding.',
        },
        {
            "role": "user",
            "content": "Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?\n\n",
        },
    ],
    "model": "gpt-3.5-turbo",
    "request_timeout": 60,
    "max_tokens": None,
    "stream": False,
    "n": 1,
    "temperature": 0.0,
    "stop": ["Observation:"],
}
```

The full body of the first `system` message passed as a message is:

```
Answer the following questions as best you can. You have access to the following tools:

Search: A search engine. Useful for when you need to answer questions about current events. Input should be a search query.
Calculator: Useful for when you need to answer questions about math.

The way you use the tools is by specifying a json blob.
Specifically, this json should have a `action` key (with the name of the tool to use) and a `action_input` key (with the input to the tool going here).

The only values that should be in the "action" field are: Search, Calculator

The $JSON_BLOB should only contain a SINGLE action, do NOT return a list of multiple actions. Here is an example of a valid $JSON_BLOB:

{
  "action": $TOOL_NAME,
  "action_input": $INPUT
}

ALWAYS use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action:
$JSON_BLOB
Observation: the result of the action
... (this Thought/Action/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question
Begin! Reminder to always use the exact characters `Final Answer` when responding.
```

This outlines the general approach to be taken by a ReAct style of prompt. The next message is of course the question to be asked:

```json
{
    "role": "user",
    "content": "Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?\n\n",
}
```

The response from the call to `https://api.openai.com/v1/chat/completions` made with these messages:

```json
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "Thought: I need to use a search engine to find Olivia Wilde's boyfriend and a calculator to raise his age to the 0.23 power.\nAction:\n```\n{\n  \"action\": \"Search\",\n  \"action_input\": \"Olivia Wilde boyfriend\"\n}\n```\n",
        "role": "assistant"
      }
    }
  ],
  "created": 1682967140,
  "id": "chatcmpl-7BSvEgSS65dG2BTjk1umzvrWhYd6t",
  "model": "gpt-3.5-turbo-0301",
  "object": "chat.completion",
  "usage": {
    "completion_tokens": 56,
    "prompt_tokens": 313,
    "total_tokens": 369
  }
}
```

Where the content of the response from the LLM is:

```
Thought: I need to use a search engine to find Olivia Wilde's boyfriend and a calculator to raise his age to the 0.23 power.
Action:
{
  "action": "Search",
  "action_input": "Olivia Wilde boyfriend"
}
```

This action is then taken by the assigned tool, SerpAPI, which searches for `Olivia Wilde boyfriend` and gets back a large JSON response. The SerpAPI tool has the following logic to select the best text from the response:

```
def _process_response(res: dict) -> str:
    """Process response from SerpAPI."""
    if "error" in res.keys():
        raise ValueError(f"Got error from SerpAPI: {res['error']}")
    if "answer_box" in res.keys() and "answer" in res["answer_box"].keys():
        toret = res["answer_box"]["answer"]
    elif "answer_box" in res.keys() and "snippet" in res["answer_box"].keys():
        toret = res["answer_box"]["snippet"]
    elif (
        "answer_box" in res.keys()
        and "snippet_highlighted_words" in res["answer_box"].keys()
    ):
        toret = res["answer_box"]["snippet_highlighted_words"][0]
    elif (
        "sports_results" in res.keys()
        and "game_spotlight" in res["sports_results"].keys()
    ):
        toret = res["sports_results"]["game_spotlight"]
    elif (
        "knowledge_graph" in res.keys()
        and "description" in res["knowledge_graph"].keys()
    ):
        toret = res["knowledge_graph"]["description"]
    elif "snippet" in res["organic_results"][0].keys():
        toret = res["organic_results"][0]["snippet"]

    else:
        toret = "No good search result found"
    return toret
 ```
 
 In this case there was a response in the `res["answer_box"]["snippet"]` that was filtered by these explicit rules which is the used as the resulting observation:
 
 ```
 Observation: Sudeikis and Wilde's relationship ended in November 2020. Wilde was publicly served with court documents regarding child custody while she was presenting Don't Worry Darling at CinemaCon 2022. In January 2021, Wilde began dating singer Harry Styles after meeting during the filming of Don't Worry Darling.
 ```
 
### 2nd call to LLM
 
The agent then makes another call to the LLM, with the addition of this observation:

```python
{
    "messages": [
        {
            "role": "system",
            "content": 'Answer the following questions as best you can. You have access to the following tools:\n\nSearch: A search engine. Useful for when you need to answer questions about current events. Input should be a search query.\nCalculator: Useful for when you need to answer questions about math.\n\nThe way you use the tools is by specifying a json blob.\nSpecifically, this json should have a `action` key (with the name of the tool to use) and a `action_input` key (with the input to the tool going here).\n\nThe only values that should be in the "action" field are: Search, Calculator\n\nThe $JSON_BLOB should only contain a SINGLE action, do NOT return a list of multiple actions. Here is an example of a valid $JSON_BLOB:\n\n```\n{\n  "action": $TOOL_NAME,\n  "action_input": $INPUT\n}\n```\n\nALWAYS use the following format:\n\nQuestion: the input question you must answer\nThought: you should always think about what to do\nAction:\n```\n$JSON_BLOB\n```\nObservation: the result of the action\n... (this Thought/Action/Observation can repeat N times)\nThought: I now know the final answer\nFinal Answer: the final answer to the original input question\n\nBegin! Reminder to always use the exact characters `Final Answer` when responding.',
        },
        {
            "role": "user",
            "content": 'Who is Olivia Wilde\'s boyfriend? What is his current age raised to the 0.23 power?\n\nThis was your previous work (but I haven\'t seen any of it! I only see what you return as final answer):\nThought: I need to use a search engine to find Olivia Wilde\'s boyfriend and a calculator to raise his age to the 0.23 power.\nAction:\n```\n{\n  "action": "Search",\n  "action_input": "Olivia Wilde boyfriend"\n}\n```\n\nObservation: Sudeikis and Wilde\'s relationship ended in November 2020. Wilde was publicly served with court documents regarding child custody while she was presenting Don\'t Worry Darling at CinemaCon 2022. In January 2021, Wilde began dating singer Harry Styles after meeting during the filming of Don\'t Worry Darling.\nThought:',
        },
    ],
    "model": "gpt-3.5-turbo",
    "request_timeout": 60,
    "max_tokens": None,
    "stream": False,
    "n": 1,
    "temperature": 0.0,
    "stop": ["Observation:"],
}

```
 
The full user message:

```
Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?

This was your previous work (but I haven\'t seen any of it! I only see what you return as final answer):
Thought: I need to use a search engine to find Olivia Wilde's boyfriend and a calculator to raise his age to the 0.23 power.
Action:
{
  "action": "Search",
  "action_input": "Olivia Wilde boyfriend"
}

Observation: Sudeikis and Wilde's relationship ended in November 2020. Wilde was publicly served with court documents regarding child custody while she was presenting Don\'t Worry Darling at CinemaCon 2022. In January 2021, Wilde began dating singer Harry Styles after meeting during the filming of Don't Worry Darling.
Thought:
```

The LLM is now being encouraged to choose the next action to take, as we an see from the response:

```json
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "I need to use a search engine to find Harry Styles' current age.\nAction:\n```\n{\n  \"action\": \"Search\",\n  \"action_input\": \"Harry Styles age\"\n}\n```\n",
        "role": "assistant"
      }
    }
  ],
  "created": 1682967146,
  "id": "chatcmpl-7BSvKMd6XzFffwW2MXkfZ4sdSY2ER",
  "model": "gpt-3.5-turbo-0301",
  "object": "chat.completion",
  "usage": {
    "completion_tokens": 40,
    "prompt_tokens": 464,
    "total_tokens": 504
  }
}
```

### 3rd call to LLM

Which, after another call to SerpAPI, results in the updated user message passed to the LLM:

```
Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?

This was your previous work (but I haven\'t seen any of it! I only see what you return as final answer):
Thought: I need to use a search engine to find Olivia Wilde\'s boyfriend and a calculator to raise his age to the 0.23 power.
Action:
{
  "action": "Search",
  "action_input": "Olivia Wilde boyfriend"
}

Observation: Sudeikis and Wilde's relationship ended in November 2020. Wilde was publicly served with court documents regarding child custody while she was presenting Don't Worry Darling at CinemaCon 2022. In January 2021, Wilde began dating singer Harry Styles after meeting during the filming of Don't Worry Darling.
Thought: I need to use a search engine to find Harry Styles' current age.
Action:
{
  "action": "Search",
  "action_input": "Harry Styles age"
 }
 
Observation: 29 years
Thought:
```

Which responds with:

```
Now I need to calculate 29 raised to the 0.23 power.
Action:
{
  "action": "Calculator",
  "action_input": "29^0.23"
}
```

Which makes a call to the Calculator tool with `29^0.23`

And formated as:

```
Observation: Answer: 2.169459462491557
```

### 4th call to the LLM

Which is then added to the next call:

```
Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?

This was your previous work (but I haven\'t seen any of it! I only see what you return as final answer):
Thought: I need to use a search engine to find Olivia Wilde\'s boyfriend and a calculator to raise his age to the 0.23 power.
Action:
{
  "action": "Search",
  "action_input": "Olivia Wilde boyfriend"
}

Observation: Sudeikis and Wilde's relationship ended in November 2020. Wilde was publicly served with court documents regarding child custody while she was presenting Don't Worry Darling at CinemaCon 2022. In January 2021, Wilde began dating singer Harry Styles after meeting during the filming of Don't Worry Darling.
Thought:I need to use a search engine to find Harry Styles' current age.
Action:
{
  "action": "Search",
  "action_input": "Harry Styles age"
 }
 
Observation: 29 years
Thought: Now I need to calculate 29 raised to the 0.23 power.
Action:
{
  "action": "Calculator",
  "action_input": "29^0.23"
}

Observation: Answer: 2.169459462491557
Thought:
```

Which the LLM responds with:

```
I now know the final answer.
Final Answer: 2.169459462491557
```
