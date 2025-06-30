# backend/database.py
import sqlite3
import click
from flask import current_app, g

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    db = get_db()
    with current_app.open_resource('schema.sql') as f:
        db.executescript(f.read().decode('utf8'))

@click.command('init-db')
def init_db_command():
    init_db()
    click.echo('Initialized the database.')

def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)

def get_all_costs(year=None, month=None):
    query = "SELECT id, name, amount, description, cost_type, strftime('%Y-%m-%dT%H:%M:%SZ', created_at) AS created_at FROM costs"
    conditions, params = [], []
    if year and month:
        conditions.append("strftime('%Y', created_at) = ?")
        params.append(year)
        conditions.append("strftime('%m', created_at) = ?")
        params.append(month)
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    query += ' ORDER BY created_at DESC'
    db = get_db()
    costs = db.execute(query, params).fetchall()
    return [dict(row) for row in costs]

def add_cost(name, amount, description, cost_type, date_str):
    db = get_db()
    db.execute('INSERT INTO costs (name, amount, description, cost_type, created_at) VALUES (?, ?, ?, ?, ?)', (name, amount, description, cost_type, date_str))
    db.commit()

def get_summary_of_months():
    query = "SELECT DISTINCT strftime('%Y', created_at) as year, strftime('%m', created_at) as month FROM costs ORDER BY year, month"
    db = get_db()
    summary = db.execute(query).fetchall()
    return [dict(row) for row in summary]

def get_all_previous_costs(year, month):
    # MODIFIED: Query now also fetches the creation date of each past expense
    query = """
        SELECT id, name, amount, description, cost_type, strftime('%Y-%m-%dT%H:%M:%SZ', created_at) AS created_at
        FROM costs
        WHERE NOT (strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?)
        ORDER BY created_at DESC;
    """
    db = get_db()
    costs = db.execute(query, (year, month)).fetchall()
    return [dict(row) for row in costs]

def batch_add_costs(costs):
    db = get_db()
    db.executemany('INSERT INTO costs (name, amount, description, cost_type, created_at) VALUES (:name, :amount, :description, :type, :date)', costs)
    db.commit()

def delete_cost_by_id(cost_id):
    db = get_db()
    db.execute('DELETE FROM costs WHERE id = ?', (cost_id,))
    db.commit()

def delete_costs_by_type(cost_type, year, month):
    db = get_db()
    db.execute("DELETE FROM costs WHERE cost_type = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?", (cost_type, year, month))
    db.commit()

def update_cost(cost_id, name, amount, description):
    db = get_db()
    db.execute('UPDATE costs SET name = ?, amount = ?, description = ? WHERE id = ?', (name, amount, description, cost_id))
    db.commit()

def update_cost_type(cost_id, new_type):
    db = get_db()
    db.execute('UPDATE costs SET cost_type = ? WHERE id = ?', (new_type, cost_id))
    db.commit()