# backend/app.py
import os
from flask import Flask, jsonify, request
from . import llm
from . import database


def create_app():
    app = Flask(__name__, static_folder="../frontend", static_url_path="/")
    app.config.from_mapping(
        DATABASE=os.path.join(app.instance_path, "financial_tracker.sqlite")
    )
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    database.init_app(app)

    # --- NEW: API Route for Document Recognition ---
    @app.route("/api/recognize", methods=["POST"])
    def recognize_document():
        if 'document_file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        doc_file = request.files['document_file']

        if doc_file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        try:
            # The file is processed in-memory and never saved to disk
            response_data = llm.recognize_expenses_from_file(doc_file)
            return jsonify(response_data)
        except Exception as e:
            print(f"Recognition Error: {e}")
            return jsonify({"error": "Failed to process document."}), 500

    @app.route("/api/transcribe", methods=["POST"])
    def transcribe_audio():
        if 'audio_file' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio_file']

        if audio_file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        try:
            # Pass the file object directly to the transcription function
            transcript_text = llm.transcribe_audio(audio_file)
            return jsonify({"transcript": transcript_text})
        except Exception as e:
            print(f"Transcription Error: {e}")
            return jsonify({"error": "Failed to transcribe audio."}), 500


    @app.route("/api/chat", methods=["POST"])
    def chat_with_llm():
        data = request.get_json()
        user_message = data.get("message")
        year = data.get("year")
        month = data.get("month")

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        if not year or not month:
            return jsonify({"error": "Missing year/month context"}), 400

        try:
            month_str = str(month).rjust(2, '0')
            budget_context = database.get_budget(year, month)
            costs_context = database.get_all_costs(str(year), month_str)

            financial_context = {
                "year": year,
                "month": month,
                "budget": budget_context,
                "costs": costs_context
            }

            llm_response = llm.get_chat_response(user_message, financial_context)

            return jsonify(llm_response)

        except Exception as e:
            print(f"LLM Error: {e}")
            return jsonify({"error": "Failed to get a response from the AI model."}), 500


    @app.route("/api/costs/budget/<int:year>/<int:month>", methods=["GET"])
    def get_budget(year, month):
        budget = database.get_budget(year, month)
        if budget:
            return jsonify(budget)
        return jsonify({"salary": 0, "savings_goal": 0, "fixed_percent": 40, "variable_percent": 30})

    @app.route("/api/costs/budget/<int:year>/<int:month>", methods=["POST"])
    def save_budget(year, month):
        data = request.get_json()
        required = ["salary", "savings_goal", "fixed_percent", "variable_percent"]
        if not data or not all(k in data for k in required):
            return jsonify({"error": "Missing data"}), 400
        database.save_budget(
            year, month, data["salary"], data["savings_goal"], data["fixed_percent"], data["variable_percent"]
        )
        return jsonify({"success": True}), 200

    @app.route("/api/budgets/history", methods=["GET"])
    def get_budgets_history():
        history = database.get_all_budgets_history()
        return jsonify(history)

    @app.route("/api/costs/history", methods=["GET"])
    def get_costs_history():
        history = database.get_costs_history()
        return jsonify(history)

    @app.route("/api/costs/summary")
    def get_costs_summary():
        return jsonify(database.get_summary_of_months())

    @app.route("/api/costs/all_previous")
    def get_all_previous():
        year, month = request.args.get("year"), request.args.get("month")
        if not all([year, month]):
            return jsonify({"error": "Missing year/month parameters"}), 400
        return jsonify(database.get_all_previous_costs(year, month))

    @app.route("/api/costs/batch_add", methods=["POST"])
    def batch_add():
        costs = request.get_json()
        if not isinstance(costs, list):
            return jsonify({"error": "Request body must be a list"}), 400
        for cost in costs:
            cost["description"] = cost.get("description", None)
        database.batch_add_costs(costs)
        return jsonify({"success": True}), 201

    @app.route("/api/costs", methods=["GET"])
    def get_costs():
        year, month = request.args.get("year"), request.args.get("month")
        return jsonify(database.get_all_costs(year=year, month=month))

    @app.route("/api/costs", methods=["POST"])
    def add_new_cost():
        data = request.get_json()
        required = ["name", "amount", "type", "date"]
        if not data or not all(k in data for k in required):
            return jsonify({"error": "Missing data"}), 400
        description = data.get("description", None)
        database.add_cost(
            data["name"], float(data["amount"]), description, data["type"], data["date"]
        )
        return jsonify({"success": True}), 201

    @app.route("/api/costs/<int:cost_id>", methods=["PUT"])
    def update_cost(cost_id):
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        database.update_cost(cost_id, data)
        return jsonify({"success": True}), 200

    @app.route("/api/costs/<int:cost_id>", methods=["DELETE"])
    def delete_cost(cost_id):
        database.delete_cost_by_id(cost_id)
        return jsonify({"success": True}), 200

    @app.route("/api/costs/clear/<string:cost_type>", methods=["DELETE"])
    def clear_costs(cost_type):
        year, month = request.args.get("year"), request.args.get("month")
        if not all([year, month]):
            return jsonify({"error": "Missing year/month parameters"}), 400
        if cost_type not in ["fixed", "variable"]:
            return jsonify({"error": "Invalid cost type"}), 400
        database.delete_costs_by_type(cost_type, year=year, month=month)
        return jsonify({"success": True}), 200

    @app.route("/api/costs/<int:cost_id>/type", methods=["PATCH"])
    def update_cost_category(cost_id):
        new_type = request.get_json().get("type")
        if not new_type or new_type not in ["fixed", "variable"]:
            return jsonify({"error": "Invalid or missing type"}), 400
        database.update_cost_type(cost_id, new_type)
        return jsonify({"success": True}), 200

    @app.route("/api/costs/<int:cost_id>/checked", methods=["PATCH"])
    def update_checked(cost_id):
        data = request.get_json()
        if "is_checked" not in data or not isinstance(data["is_checked"], bool):
            return jsonify({"error": "Invalid or missing is_checked field"}), 400
        database.update_checked_status(cost_id, 1 if data["is_checked"] else 0)
        return jsonify({"success": True}), 200

    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    return app


app = create_app()