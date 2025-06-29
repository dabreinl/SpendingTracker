# backend/app.py

import os
from flask import Flask, jsonify, request, send_from_directory

def create_app():
    app = Flask(__name__, static_folder='../frontend', static_url_path='/')
    app.config.from_mapping(DATABASE=os.path.join(app.instance_path, 'financial_tracker.sqlite'))
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    from . import database
    database.init_app(app)

    # API Routes
    @app.route('/api/costs', methods=['GET'])
    def get_costs():
        year = request.args.get('year')
        month = request.args.get('month')
        all_costs = database.get_all_costs(year=year, month=month)
        return jsonify(all_costs)

    @app.route('/api/costs', methods=['POST'])
    def add_new_cost():
        data = request.get_json()
        database.add_cost(data['name'], float(data['amount']), data['type'])
        return jsonify({'success': True}), 201

    @app.route('/api/costs/<int:cost_id>', methods=['DELETE'])
    def delete_cost(cost_id):
        database.delete_cost_by_id(cost_id)
        return jsonify({'success': True}), 200

    @app.route('/api/costs/clear/<string:cost_type>', methods=['DELETE'])
    def clear_costs(cost_type):
        year = request.args.get('year')
        month = request.args.get('month')
        if not all([year, month]):
            return jsonify({'error': 'Missing year and/or month parameters'}), 400
        if cost_type not in ['fixed', 'variable']:
            return jsonify({'error': 'Invalid cost type'}), 400
        database.delete_costs_by_type(cost_type, year=year, month=month)
        return jsonify({'success': True}), 200
        
    @app.route('/api/costs/<int:cost_id>/type', methods=['PUT'])
    def update_cost_category(cost_id):
        data = request.get_json()
        new_type = data.get('type')
        database.update_cost_type(cost_id, new_type)
        return jsonify({'success': True}), 200

    @app.route('/')
    def index():
        return app.send_static_file('index.html')

    return app

app = create_app()