# backend/database.py
import sqlite3
import click
from flask import current_app, g


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE"], detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    with current_app.open_resource("schema.sql") as f:
        db.executescript(f.read().decode("utf8"))


@click.command("init-db")
def init_db_command():
    init_db()
    click.echo("Initialized the database.")


def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)


def get_all_costs(year=None, month=None):
    query = "SELECT id, name, amount, description, cost_type, is_checked, strftime('%Y-%m-%dT%H:%M:%SZ', created_at) AS created_at FROM costs"
    conditions, params = [], []
    if year and month:
        conditions.append("strftime('%Y', created_at) = ?")
        params.append(year)
        conditions.append("strftime('%m', created_at) = ?")
        params.append(month)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY is_checked ASC, created_at DESC"
    return [dict(row) for row in get_db().execute(query, params).fetchall()]


def add_cost(name, amount, description, cost_type, date_str):
    db = get_db()
    db.execute(
        "INSERT INTO costs (name, amount, description, cost_type, created_at) VALUES (?, ?, ?, ?, ?)",
        (name, amount, description, cost_type, date_str),
    )
    db.commit()


def get_summary_of_months():
    query = "SELECT DISTINCT strftime('%Y', created_at) as year, strftime('%m', created_at) as month FROM costs ORDER BY year, month"
    return [dict(row) for row in get_db().execute(query).fetchall()]


def get_all_previous_costs(year, month):
    query = "SELECT id, name, amount, description, cost_type, strftime('%Y-%m-%dT%H:%M:%SZ', created_at) AS created_at FROM costs WHERE NOT (strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?) ORDER BY created_at DESC;"
    return [dict(row) for row in get_db().execute(query, (year, month)).fetchall()]


def batch_add_costs(costs):
    db = get_db()
    db.executemany(
        "INSERT INTO costs (name, amount, description, cost_type, created_at) VALUES (:name, :amount, :description, :type, :date)",
        costs,
    )
    db.commit()


def delete_cost_by_id(cost_id):
    db = get_db()
    db.execute("DELETE FROM costs WHERE id = ?", (cost_id,))
    db.commit()


def delete_costs_by_type(cost_type, year, month):
    db = get_db()
    db.execute(
        "DELETE FROM costs WHERE cost_type = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?",
        (cost_type, year, month),
    )
    db.commit()


def update_cost(cost_id, updates):
    """
    Updates a cost record with the given data.
    'updates' is a dictionary containing the fields to update.
    """
    db = get_db()
    allowed_fields = {"name", "amount", "description", "cost_type"}

    # Sanitize the updates dictionary
    fields_to_update = {k: v for k, v in updates.items() if k in allowed_fields and v is not None}

    if not fields_to_update:
        # No valid fields to update
        return

    set_clause = ", ".join([f"{key} = ?" for key in fields_to_update.keys()])
    params = list(fields_to_update.values())
    params.append(cost_id)

    query = f"UPDATE costs SET {set_clause} WHERE id = ?"
    db.execute(query, tuple(params))
    db.commit()


def update_cost_type(cost_id, new_type):
    db = get_db()
    db.execute("UPDATE costs SET cost_type = ? WHERE id = ?", (new_type, cost_id))
    db.commit()


def update_checked_status(cost_id, is_checked):
    db = get_db()
    db.execute("UPDATE costs SET is_checked = ? WHERE id = ?", (is_checked, cost_id))
    db.commit()


def get_budget(year, month):
    budget = (
        get_db()
        .execute(
            "SELECT salary, savings_goal, fixed_percent, variable_percent FROM budgets WHERE year = ? AND month = ?",
            (year, month),
        )
        .fetchone()
    )
    return dict(budget) if budget else None


def save_budget(year, month, salary, savings_goal, fixed_percent, variable_percent):
    db = get_db()
    db.execute(
        """
        INSERT INTO budgets (year, month, salary, savings_goal, fixed_percent, variable_percent) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(year, month) DO UPDATE SET salary=excluded.salary, savings_goal=excluded.savings_goal, fixed_percent=excluded.fixed_percent, variable_percent=excluded.variable_percent
        """,
        (year, month, salary, savings_goal, fixed_percent, variable_percent),
    )
    db.commit()


def get_all_budgets_history():
    query = "SELECT year, month, salary FROM budgets WHERE salary > 0 ORDER BY year, month"
    return [dict(row) for row in get_db().execute(query).fetchall()]


def get_costs_history():
    query = """
        SELECT
            strftime('%Y', created_at) as year,
            strftime('%m', created_at) as month,
            cost_type,
            SUM(amount) as total
        FROM costs
        GROUP BY year, month, cost_type
        ORDER BY year, month
    """
    return [dict(row) for row in get_db().execute(query).fetchall()]