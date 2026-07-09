from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated, Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage
import os
import operator
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import InMemorySaver
from dotenv import load_dotenv

load_dotenv()

os.environ["OPENAI_API_BASE"] = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
os.environ["OPENAI_API_KEY"] = "sk-ws-H.PYPMHD.xOUa.MEUCIQCvwIHqK3BOLf8EbGTwscVE_zsBd6au2brxrhxOcvcUYAIgbY5-rEOaNh_auWqhpK-vex1MxCNFlw3-wt3Tz7zmma4"
model = ChatOpenAI(model="qwen-omni-turbo")

class ChatBot(TypedDict):
    messages: Annotated[list[BaseMessage],add_messages]

def chat_msg(state:ChatBot):
    messages = state['messages']
    response = model.invoke(messages)
    return {'messages': response}

checkpoint = InMemorySaver()

graph = StateGraph(ChatBot)

graph.add_node("Chat_Message", chat_msg)

graph.add_edge(START,"Chat_Message")
graph.add_edge("Chat_Message", END)

workflow = graph.compile(checkpointer=checkpoint)


