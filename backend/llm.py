# backend/llm.py
import os
import json
import base64
import google.generativeai as genai
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from pydantic import BaseModel, Field
from typing import List, Optional

# Load environment variables from .env file
load_dotenv()

# Ensure the Google API key is set
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set. Please create a .env file and add it.")

genai.configure(api_key=api_key)

# --- Pydantic Models for Tool Definition (using Pydantic v2) ---
class Expense(BaseModel):
    """A single expense item."""
    name: str = Field(description="The name of the expense.")
    amount: float = Field(description="The numerical amount of the expense.")
    type: str = Field(description="The category of the expense. Must be 'fixed' (e.g., rent, subscriptions) or 'variable' (e.g., coffee, gas, groceries).")
    description: Optional[str] = Field(default=None, description="A detailed description of the expense, if the user provides one.")

class CreateExpensesArgs(BaseModel):
    """Input model for the create_expenses tool."""
    expenses: List[Expense] = Field(description="A list of one or more expense items to be logged.")

class EditExpenseArgs(BaseModel):
    """Input model for the edit_expense tool."""
    original_name: str = Field(description="The original name of the expense to be edited. This must match an existing expense from the user's list exactly.")
    new_name: Optional[str] = Field(default=None, description="The new name for the expense.")
    new_amount: Optional[float] = Field(default=None, description="The new amount for the expense.")
    new_type: Optional[str] = Field(default=None, description="The new type for the expense. Must be 'fixed' or 'variable'.")
    new_description: Optional[str] = Field(default=None, description="The new description for the expense.")


# --- Tool Definition (using modern @tool decorator) ---
@tool(args_schema=CreateExpensesArgs)
def create_expenses(expenses: List[Expense]):
    """
    Use this tool when you need to log one or more new financial expenses.
    The user must confirm these expenses before they are officially saved.
    """
    return [expense.model_dump() for expense in expenses]

@tool(args_schema=EditExpenseArgs)
def edit_expense(original_name: str, new_name: Optional[str] = None, new_amount: Optional[float] = None, new_type: Optional[str] = None, new_description: Optional[str] = None):
    """
    Use this tool when the user wants to change or update an existing expense.
    You must use the 'original_name' to identify the expense to change.
    Only include the parameters for the fields that the user wants to modify.
    The user must confirm these changes before they are officially saved.
    """
    args = {
        "original_name": original_name,
        "new_name": new_name,
        "new_amount": new_amount,
        "new_type": new_type,
        "new_description": new_description,
    }
    return {k: v for k, v in args.items() if v is not None}


# --- LLM and Conversation Chain Setup ---

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5, convert_system_message_to_human=True)
llm_with_tools = llm.bind_tools([create_expenses, edit_expense], tool_choice="auto")
memory = ConversationBufferWindowMemory(k=4, return_messages=True)

MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
    7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"
}

def transcribe_audio(audio_file):
    """
    Transcribes the given audio file using the Gemini API.
    """
    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = "Provide a transcript for this audio."
    audio_part = {
        "mime_type": audio_file.mimetype,
        "data": audio_file.read()
    }
    response = model.generate_content([prompt, audio_part])

    if response.parts:
        return response.text
    else:
        print("Transcription failed. Full response:", response)
        raise ValueError("The model did not return a valid transcription.")

def recognize_expenses_from_file(file_storage):
    """
    Recognizes expenses from an uploaded file using Gemini and LangChain.
    """
    # --- THIS IS THE MODIFIED PROMPT ---
    prompt_text = """
    Analyze the attached document (which could be a receipt or text from a bank statement).
    Extract all relevant expense items. For each item, determine a logical name, the amount,
    and classify it as 'fixed' or 'variable'.

    If possible, also extract a detailed `description` for the expense. For example, if it's a grocery receipt, the description could be a list of the items purchased. For a bill, it might be the service period.

    Use the 'create_expenses' tool to return the data.
    If the document contains no discernible expenses, do not call the tool.
    """
    # --- END OF MODIFICATION ---
    
    file_data = file_storage.read()
    file_mime_type = file_storage.mimetype
    
    encoded_file = base64.b64encode(file_data).decode('utf-8')
    
    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt_text},
            {
                "type": "image_url",
                "image_url": f"data:{file_mime_type};base64,{encoded_file}"
            }
        ]
    )
    
    llm_with_forced_tool = llm.bind_tools([create_expenses], tool_choice="create_expenses")
    response = llm_with_forced_tool.invoke([message])

    if not response.tool_calls:
        return {
            "reply": "I had trouble reading that document or couldn't find any expenses. Please try a different file.",
            "pending_actions": None
        }

    try:
        tool_call = response.tool_calls[0]
        if tool_call['name'] == 'create_expenses':
            expenses_to_log = tool_call['args']['expenses']
            
            if expenses_to_log:
                message_parts = [f"I found {len(expenses_to_log)} expenses in your document. Here they are:\n"]
                for expense in expenses_to_log:
                    desc_part = f" (Note: *{expense.get('description', '')}*)" if expense.get('description') else ""
                    amount = float(expense.get('amount', 0))
                    message_parts.append(
                        f"- **{expense.get('name', 'N/A')}**: ${amount:.2f} ({expense.get('type', 'N/A').capitalize()}){desc_part}"
                    )
                message_parts.append("\nShould I log these for you?")
                reply_text = "\n".join(message_parts)
            else:
                reply_text = "I couldn't find any expenses in that document. Please try a different one."

            return {
                "reply": reply_text,
                "pending_actions": {
                    "tool_name": "create_expenses",
                    "tool_args": expenses_to_log
                }
            }
    except (AttributeError, IndexError, KeyError) as e:
        print(f"Error parsing tool call from document recognition: {e}")
        return {
            "reply": "I had trouble parsing the expenses from that document. Please try again.",
            "pending_actions": None
        }

    return {"reply": "An unexpected error occurred.", "pending_actions": None}


def _build_context_prompt(financial_context):
    """Builds a detailed string prompt from the financial data."""
    year = financial_context.get("year")
    month_num = financial_context.get("month")
    month_name = MONTH_NAMES.get(month_num, "N/A")
    budget = financial_context.get("budget") or {}
    costs = financial_context.get("costs") or []

    prompt_parts = [
        f"You are a helpful and friendly financial assistant. It is currently {month_name} {year}.",
        "Your primary goal is to help the user manage their finances.",

        "--- Expense Creation Rules ---",
        "When the user asks you to log, add, or create expenses, you must use the 'create_expenses' tool.",
        "1. You MUST decide if an expense is 'fixed' or 'variable'. Fixed costs are recurring and predictable (e.g., rent, internet bill, Netflix subscription). Variable costs fluctuate (e.g., coffee, gas, groceries, concert tickets).",
        "2. If the user provides extra details or notes about an expense, you MUST capture this in the 'description' field.",
        "3. After you decide to use the tool, formulate a friendly, conversational question asking the user to confirm the expenses you've identified.",
        "-----------------------------",

        "--- Expense Editing Rules ---",
        "When the user asks to change, modify, or edit an existing expense, you must use the 'edit_expense' tool.",
        "1. You MUST use the 'original_name' argument to identify the expense. Get this name from the 'Financial Data Summary' below. Be precise.",
        "2. Only include the arguments for the fields that are changing (e.g., new_amount, new_type).",
        "3. If the user is ambiguous about which expense to edit (e.g., they have two expenses named 'Coffee'), ask them to clarify before using the tool.",
        "4. After deciding to use the tool, ask the user a clear question to confirm the proposed change.",
        "-----------------------------",

        "Analyze the user's financial data provided below to answer their other questions.",
        "Your answers should be direct, insightful, and based *only* on the provided data. Do not make up information.",
        "\n--- FINANCIAL DATA SUMMARY ---\n"
    ]

    salary = budget.get('salary', 0)
    savings_goal = budget.get('savings_goal', 0)
    prompt_parts.append(f"**Budget:**")
    prompt_parts.append(f"- Monthly Income: ${salary:,.2f}")
    prompt_parts.append(f"- Monthly Savings Goal: ${savings_goal:,.2f}\n")

    fixed_costs = [c for c in costs if c['cost_type'] == 'fixed']
    variable_costs = [c for c in costs if c['cost_type'] == 'variable']
    total_fixed = sum(c['amount'] for c in fixed_costs)
    total_variable = sum(c['amount'] for c in variable_costs)
    total_spending = total_fixed + total_variable

    prompt_parts.append(f"**Spending:**")
    prompt_parts.append(f"- Total Fixed Costs: ${total_fixed:,.2f}")
    prompt_parts.append(f"- Total Variable Costs: ${total_variable:,.2f}")
    prompt_parts.append(f"- **Grand Total Spending:** ${total_spending:,.2f}\n")

    if fixed_costs:
        prompt_parts.append("Fixed Expenses List:")
        for cost in fixed_costs:
            prompt_parts.append(f"  - {cost['name']}: ${cost['amount']:,.2f}")

    if variable_costs:
        prompt_parts.append("\nVariable Expenses List:")
        for cost in variable_costs:
            prompt_parts.append(f"  - {cost['name']}: ${cost['amount']:,.2f}")

    prompt_parts.append("\n------------------------------\n")
    return "\n".join(prompt_parts)


def get_chat_response(user_input, financial_context):
    """
    Gets a response from the LLM, including financial data and tool-use capability.
    """
    chat_history = memory.load_memory_variables({}).get("history", [])
    context_prompt = _build_context_prompt(financial_context)

    prompt = ChatPromptTemplate.from_messages([
        ("system", context_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
    ])

    chain = prompt | llm_with_tools

    response = chain.invoke({
        "chat_history": chat_history,
        "input": user_input
    })

    if response.tool_calls:
        tool_call = response.tool_calls[0]
        tool_args = tool_call['args']
        reply_text = response.content

        if tool_call['name'] == 'create_expenses':
            if not reply_text or reply_text.isspace():
                message_parts = ["I'm ready to log the following expenses for you:\n"]
                for expense in tool_args.get('expenses', []):
                    desc_part = f" (Note: *{expense['description']}*)" if expense.get('description') else ""
                    message_parts.append(
                        f"- **{expense['name']}**: ${expense['amount']:.2f} ({expense['type'].capitalize()}){desc_part}"
                    )
                message_parts.append("\nIs this correct?")
                reply_text = "\n".join(message_parts)

            memory_output_for_ai = f"I have proposed creating {len(tool_args.get('expenses', []))} expenses and am awaiting user confirmation."
            memory.save_context({"input": user_input}, {"output": memory_output_for_ai})

            return {
                "reply": reply_text,
                "pending_actions": {
                    "tool_name": tool_call['name'],
                    "tool_args": tool_args['expenses']
                }
            }

        if tool_call['name'] == 'edit_expense':
            if not reply_text or reply_text.isspace():
                original_name = tool_args.get('original_name')
                changes = []
                if 'new_name' in tool_args: changes.append(f"new name to **{tool_args['new_name']}**")
                if 'new_amount' in tool_args: changes.append(f"amount to **${tool_args['new_amount']:.2f}**")
                if 'new_type' in tool_args: changes.append(f"category to **{tool_args['new_type'].capitalize()}**")
                if 'new_description' in tool_args: changes.append(f"description to *'{tool_args['new_description']}'*")

                reply_text = f"Should I update the expense **'{original_name}'** and change its {', '.join(changes)}? Let me know!"

            memory_output_for_ai = "I have proposed an edit to an expense and am awaiting user confirmation."
            memory.save_context({"input": user_input}, {"output": memory_output_for_ai})

            return {
                "reply": reply_text,
                "pending_actions": {
                    "tool_name": tool_call['name'],
                    "tool_args": tool_args
                }
            }

    else:
        memory.save_context({"input": user_input}, {"output": response.content})
        return {"reply": response.content}