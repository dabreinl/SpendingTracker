# backend/llm.py
import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from pydantic import BaseModel, Field
from typing import List, Optional

# Load environment variables from .env file
load_dotenv()

# Ensure the Google API key is set
if "GOOGLE_API_KEY" not in os.environ:
    raise ValueError("GOOGLE_API_KEY environment variable not set. Please create a .env file and add it.")


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


# --- Tool Definition (using modern @tool decorator) ---
@tool(args_schema=CreateExpensesArgs)
def create_expenses(expenses: List[Expense]):
    """
    Use this tool when you need to log one or more financial expenses.
    The user must confirm these expenses before they are officially saved.
    """
    # Using .model_dump() is the Pydantic v2 equivalent of .dict()
    return [expense.model_dump() for expense in expenses]


# --- LLM and Conversation Chain Setup ---

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite-preview-06-17", temperature=0.5, convert_system_message_to_human=True)
llm_with_tools = llm.bind_tools([create_expenses], tool_choice="auto")
memory = ConversationBufferWindowMemory(k=4, return_messages=True)

MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
    7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"
}

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
        "When the user asks you to log, add, or create expenses, you must use the 'create_expenses' tool.",
        
        "--- Expense Creation Rules ---",
        "1. You MUST decide if an expense is 'fixed' or 'variable'. Fixed costs are recurring and predictable (e.g., rent, internet bill, Netflix subscription). Variable costs fluctuate (e.g., coffee, gas, groceries, concert tickets).",
        "2. If the user provides extra details or notes about an expense, you MUST capture this in the 'description' field.",
        "3. After you decide to use the tool, formulate a friendly, conversational question asking the user to confirm the expenses you've identified.",
        "-----------------------------",

        "Analyze the user's financial data provided below to answer their other questions.",
        "Your answers should be direct, insightful, and based *only* on the provided data. Do not make up information.",
        "\n--- FINANCIAL DATA SUMMARY ---\n"
    ]

    # ... (rest of the prompt building is the same)
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
        expenses_to_log = tool_call['args']['expenses']
        
        reply_text = response.content

        if not reply_text or reply_text.isspace():
            message_parts = ["I'm ready to log the following expenses for you:\n"]
            for expense in expenses_to_log:
                desc_part = f" (Note: *{expense['description']}*)" if expense.get('description') else ""
                message_parts.append(
                    f"- **{expense['name']}**: ${expense['amount']:.2f} ({expense['type'].capitalize()}){desc_part}"
                )
            message_parts.append("\nIs this correct?")
            reply_text = "\n".join(message_parts)

        # MODIFIED: Save a specific message to memory that represents the completed action proposal.
        # This prevents the AI from re-running the tool on its next turn.
        memory_output_for_ai = f"I have proposed creating {len(expenses_to_log)} expenses and am awaiting user confirmation. I will not propose them again."
        memory.save_context({"input": user_input}, {"output": memory_output_for_ai})

        return {
            "reply": reply_text,
            "pending_actions": {
                "tool_name": tool_call['name'],
                "tool_args": expenses_to_log
            }
        }
    else:
        # This handles regular conversation without tool use
        memory.save_context({"input": user_input}, {"output": response.content})
        return {"reply": response.content}