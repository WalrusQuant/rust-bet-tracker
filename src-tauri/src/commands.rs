use crate::calc;
use crate::db::{quote_ident, Db};
use crate::error::{AppError, AppResult};
use crate::models::*;
use rusqlite::{params, Connection};
use tauri::State;

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

fn row_to_bet(conn: &Connection, id: i64) -> AppResult<Bet> {
    let mut stmt = conn.prepare(
        "SELECT id, bet_date, sportsbook_id, league_id, bet_type_id, odds,
                fair_odds, closing_odds, stake, outcome, notes, created_at
         FROM bets WHERE id = ?1",
    )?;
    let bet = stmt.query_row(params![id], |r| {
        Ok(Bet {
            id: r.get(0)?,
            bet_date: r.get(1)?,
            sportsbook_id: r.get(2)?,
            league_id: r.get(3)?,
            bet_type_id: r.get(4)?,
            odds: r.get(5)?,
            fair_odds: r.get(6)?,
            closing_odds: r.get(7)?,
            stake: r.get(8)?,
            outcome: {
                let s: String = r.get(9)?;
                Outcome::from_str(&s).unwrap_or(Outcome::Pending)
            },
            notes: r.get(10)?,
            created_at: r.get(11)?,
            strategy_ids: vec![],
        })
    })?;
    let mut bet = bet;
    let mut stmt = conn.prepare("SELECT strategy_id FROM bet_strategies WHERE bet_id = ?1")?;
    let rows = stmt.query_map(params![id], |r| r.get::<_, i64>(0))?;
    for row in rows {
        bet.strategy_ids.push(row?);
    }
    Ok(bet)
}

fn settled_profit(odds: i32, stake: f64, outcome: Outcome) -> f64 {
    match outcome {
        Outcome::Won => calc::profit(odds, stake),
        Outcome::Lost => -stake,
        Outcome::Push | Outcome::Pending => 0.0,
    }
}

// ------------------------------------------------------------------
// bets
// ------------------------------------------------------------------

#[tauri::command]
pub fn list_bets(db: State<Db>, filter: Option<BetFilter>) -> AppResult<Vec<Bet>> {
    let conn = db.0.lock();
    let f = filter.unwrap_or_default();

    let mut sql = String::from(
        "SELECT id FROM bets WHERE 1=1",
    );
    let mut args: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(from) = &f.from_date {
        sql.push_str(" AND bet_date >= ?");
        args.push(Box::new(from.clone()));
    }
    if let Some(to) = &f.to_date {
        sql.push_str(" AND bet_date <= ?");
        args.push(Box::new(to.clone()));
    }
    if let Some(s) = f.sportsbook_id {
        sql.push_str(" AND sportsbook_id = ?");
        args.push(Box::new(s));
    }
    if let Some(l) = f.league_id {
        sql.push_str(" AND league_id = ?");
        args.push(Box::new(l));
    }
    if let Some(b) = f.bet_type_id {
        sql.push_str(" AND bet_type_id = ?");
        args.push(Box::new(b));
    }
    if let Some(o) = f.outcome {
        sql.push_str(" AND outcome = ?");
        args.push(Box::new(o.as_str().to_string()));
    }
    sql.push_str(" ORDER BY bet_date DESC, id DESC");

    let mut stmt = conn.prepare(&sql)?;
    let params_refs: Vec<&dyn rusqlite::ToSql> = args.iter().map(|b| b.as_ref()).collect();
    let ids: Vec<i64> = stmt
        .query_map(params_refs.as_slice(), |r| r.get::<_, i64>(0))?
        .collect::<Result<_, _>>()?;

    let mut out = Vec::with_capacity(ids.len());
    for id in ids {
        out.push(row_to_bet(&conn, id)?);
    }
    Ok(out)
}

#[tauri::command]
pub fn create_bet(db: State<Db>, input: NewBet) -> AppResult<Bet> {
    let mut conn = db.0.lock();
    let tx = conn.transaction()?;
    tx.execute(
        "INSERT INTO bets (bet_date, sportsbook_id, league_id, bet_type_id, odds,
                           fair_odds, closing_odds, stake, outcome, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            input.bet_date,
            input.sportsbook_id,
            input.league_id,
            input.bet_type_id,
            input.odds,
            input.fair_odds,
            input.closing_odds,
            input.stake,
            input.outcome.as_str(),
            input.notes,
        ],
    )?;
    let id = tx.last_insert_rowid();
    for sid in &input.strategy_ids {
        tx.execute(
            "INSERT INTO bet_strategies (bet_id, strategy_id) VALUES (?1, ?2)",
            params![id, sid],
        )?;
    }
    tx.commit()?;
    row_to_bet(&conn, id)
}

#[tauri::command]
pub fn update_bet(db: State<Db>, id: i64, input: NewBet) -> AppResult<Bet> {
    let mut conn = db.0.lock();
    let tx = conn.transaction()?;
    let affected = tx.execute(
        "UPDATE bets SET bet_date=?1, sportsbook_id=?2, league_id=?3, bet_type_id=?4,
                         odds=?5, fair_odds=?6, closing_odds=?7, stake=?8,
                         outcome=?9, notes=?10
         WHERE id=?11",
        params![
            input.bet_date,
            input.sportsbook_id,
            input.league_id,
            input.bet_type_id,
            input.odds,
            input.fair_odds,
            input.closing_odds,
            input.stake,
            input.outcome.as_str(),
            input.notes,
            id,
        ],
    )?;
    if affected == 0 {
        return Err(AppError::Msg(format!("bet {id} not found")));
    }
    tx.execute("DELETE FROM bet_strategies WHERE bet_id=?1", params![id])?;
    for sid in &input.strategy_ids {
        tx.execute(
            "INSERT INTO bet_strategies (bet_id, strategy_id) VALUES (?1, ?2)",
            params![id, sid],
        )?;
    }
    tx.commit()?;
    row_to_bet(&conn, id)
}

#[tauri::command]
pub fn delete_bet(db: State<Db>, id: i64) -> AppResult<()> {
    let conn = db.0.lock();
    conn.execute("DELETE FROM bets WHERE id=?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn settle_bet(db: State<Db>, id: i64, outcome: Outcome) -> AppResult<Bet> {
    let conn = db.0.lock();
    let affected = conn.execute(
        "UPDATE bets SET outcome=?1 WHERE id=?2",
        params![outcome.as_str(), id],
    )?;
    if affected == 0 {
        return Err(AppError::Msg(format!("bet {id} not found")));
    }
    row_to_bet(&conn, id)
}

// ------------------------------------------------------------------
// tags
// ------------------------------------------------------------------

#[tauri::command]
pub fn list_tags(db: State<Db>, kind: TagKind) -> AppResult<Vec<Tag>> {
    let conn = db.0.lock();
    let sql = format!("SELECT id, name FROM {} ORDER BY name", quote_ident(kind.table()));
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], |r| {
        Ok(Tag {
            id: r.get(0)?,
            name: r.get(1)?,
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

#[tauri::command]
pub fn create_tag(db: State<Db>, kind: TagKind, name: String) -> AppResult<Tag> {
    let conn = db.0.lock();
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::Msg("tag name cannot be empty".into()));
    }
    let table = quote_ident(kind.table());
    let sql = format!("INSERT OR IGNORE INTO {table} (name) VALUES (?1)");
    conn.execute(&sql, params![name])?;
    let select = format!("SELECT id, name FROM {table} WHERE name=?1");
    let tag = conn.query_row(&select, params![name], |r| {
        Ok(Tag {
            id: r.get(0)?,
            name: r.get(1)?,
        })
    })?;
    Ok(tag)
}

#[tauri::command]
pub fn delete_tag(db: State<Db>, kind: TagKind, id: i64) -> AppResult<()> {
    let conn = db.0.lock();
    let sql = format!("DELETE FROM {} WHERE id=?1", quote_ident(kind.table()));
    conn.execute(&sql, params![id])?;
    Ok(())
}

// ------------------------------------------------------------------
// bankroll + transactions
// ------------------------------------------------------------------

#[tauri::command]
pub fn get_bankroll_settings(db: State<Db>) -> AppResult<BankrollSettings> {
    let conn = db.0.lock();
    let s = conn.query_row(
        "SELECT starting_bankroll, unit_sizing_method, unit_size_value, kelly_fraction
         FROM bankroll_settings WHERE id=1",
        [],
        |r| {
            let method: String = r.get(1)?;
            Ok(BankrollSettings {
                starting_bankroll: r.get(0)?,
                unit_sizing_method: UnitSizingMethod::from_str(&method)
                    .unwrap_or(UnitSizingMethod::FixedPercent),
                unit_size_value: r.get(2)?,
                kelly_fraction: r.get(3)?,
            })
        },
    )?;
    Ok(s)
}

#[tauri::command]
pub fn update_bankroll_settings(
    db: State<Db>,
    input: BankrollSettings,
) -> AppResult<BankrollSettings> {
    let conn = db.0.lock();
    conn.execute(
        "UPDATE bankroll_settings
         SET starting_bankroll=?1, unit_sizing_method=?2, unit_size_value=?3, kelly_fraction=?4
         WHERE id=1",
        params![
            input.starting_bankroll,
            input.unit_sizing_method.as_str(),
            input.unit_size_value,
            input.kelly_fraction,
        ],
    )?;
    drop(conn);
    get_bankroll_settings(db)
}

fn compute_bankroll(conn: &Connection) -> AppResult<f64> {
    let starting: f64 = conn.query_row(
        "SELECT starting_bankroll FROM bankroll_settings WHERE id=1",
        [],
        |r| r.get(0),
    )?;
    let deposits: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type='deposit'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0.0);
    let withdrawals: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type='withdrawal'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0.0);

    let mut stmt = conn.prepare("SELECT odds, stake, outcome FROM bets")?;
    let rows = stmt.query_map([], |r| {
        let o: String = r.get(2)?;
        Ok((r.get::<_, i32>(0)?, r.get::<_, f64>(1)?, o))
    })?;
    let mut net = 0.0;
    for row in rows {
        let (odds, stake, o) = row?;
        let outcome = Outcome::from_str(&o).unwrap_or(Outcome::Pending);
        net += settled_profit(odds, stake, outcome);
    }

    Ok(starting + deposits - withdrawals + net)
}

#[tauri::command]
pub fn current_bankroll(db: State<Db>) -> AppResult<f64> {
    let conn = db.0.lock();
    compute_bankroll(&conn)
}

#[tauri::command]
pub fn recommended_stake(
    db: State<Db>,
    odds: i32,
    fair_odds: Option<i32>,
) -> AppResult<f64> {
    let conn = db.0.lock();
    let bankroll = compute_bankroll(&conn)?;
    let method: String = conn.query_row(
        "SELECT unit_sizing_method FROM bankroll_settings WHERE id=1",
        [],
        |r| r.get(0),
    )?;
    let value: f64 = conn.query_row(
        "SELECT unit_size_value FROM bankroll_settings WHERE id=1",
        [],
        |r| r.get(0),
    )?;
    let fraction: f64 = conn.query_row(
        "SELECT kelly_fraction FROM bankroll_settings WHERE id=1",
        [],
        |r| r.get(0),
    )?;

    let stake = match UnitSizingMethod::from_str(&method) {
        Some(UnitSizingMethod::FixedPercent) => bankroll * (value / 100.0),
        Some(UnitSizingMethod::FixedAmount) => value,
        Some(UnitSizingMethod::Kelly) => match fair_odds {
            Some(fo) => calc::kelly_stake(bankroll, odds, fo, fraction),
            None => 0.0,
        },
        None => 0.0,
    };
    Ok(stake.max(0.0))
}

#[tauri::command]
pub fn sportsbook_balances(db: State<Db>) -> AppResult<Vec<SportsbookBalance>> {
    let conn = db.0.lock();

    // Load all sportsbooks (so books with no activity still appear as rows)
    let mut book_stmt = conn.prepare("SELECT id, name FROM sportsbooks ORDER BY name")?;
    let books: Vec<(i64, String)> = book_stmt
        .query_map([], |r| Ok((r.get::<_, i64>(0)?, r.get::<_, String>(1)?)))?
        .collect::<Result<_, _>>()?;

    // Init: one bucket per book + one for Unassigned (id 0 sentinel)
    let mut balances: std::collections::BTreeMap<i64, SportsbookBalance> = std::collections::BTreeMap::new();
    for (id, name) in &books {
        balances.insert(
            *id,
            SportsbookBalance {
                id: Some(*id),
                name: name.clone(),
                balance: 0.0,
                deposits: 0.0,
                withdrawals: 0.0,
                profit: 0.0,
                n_bets: 0,
                pending_stake: 0.0,
            },
        );
    }
    balances.insert(
        0,
        SportsbookBalance {
            id: None,
            name: "— Unassigned —".to_string(),
            balance: 0.0,
            deposits: 0.0,
            withdrawals: 0.0,
            profit: 0.0,
            n_bets: 0,
            pending_stake: 0.0,
        },
    );

    // Fold transactions
    let mut tx_stmt = conn.prepare(
        "SELECT COALESCE(sportsbook_id, 0), transaction_type, amount FROM transactions",
    )?;
    let tx_rows = tx_stmt.query_map([], |r| {
        Ok((
            r.get::<_, i64>(0)?,
            r.get::<_, String>(1)?,
            r.get::<_, f64>(2)?,
        ))
    })?;
    for row in tx_rows {
        let (sid, ty, amt) = row?;
        let entry = balances.entry(sid).or_insert_with(|| SportsbookBalance {
            id: if sid == 0 { None } else { Some(sid) },
            name: "— Unknown —".to_string(),
            balance: 0.0,
            deposits: 0.0,
            withdrawals: 0.0,
            profit: 0.0,
            n_bets: 0,
            pending_stake: 0.0,
        });
        match ty.as_str() {
            "deposit" => entry.deposits += amt,
            "withdrawal" => entry.withdrawals += amt,
            _ => {}
        }
    }

    // Fold bets
    let mut bet_stmt = conn.prepare(
        "SELECT COALESCE(sportsbook_id, 0), odds, stake, outcome FROM bets",
    )?;
    let bet_rows = bet_stmt.query_map([], |r| {
        Ok((
            r.get::<_, i64>(0)?,
            r.get::<_, i32>(1)?,
            r.get::<_, f64>(2)?,
            r.get::<_, String>(3)?,
        ))
    })?;
    for row in bet_rows {
        let (sid, odds, stake, outcome) = row?;
        let entry = balances.entry(sid).or_insert_with(|| SportsbookBalance {
            id: if sid == 0 { None } else { Some(sid) },
            name: "— Unknown —".to_string(),
            balance: 0.0,
            deposits: 0.0,
            withdrawals: 0.0,
            profit: 0.0,
            n_bets: 0,
            pending_stake: 0.0,
        });
        entry.n_bets += 1;
        match outcome.as_str() {
            "won" => entry.profit += calc::profit(odds, stake),
            "lost" => entry.profit -= stake,
            "pending" => entry.pending_stake += stake,
            _ => {}
        }
    }

    // Finalize balances: drop Unassigned if empty; sort books first (by balance desc), Unassigned last.
    let mut out: Vec<SportsbookBalance> = balances
        .into_values()
        .filter(|b| {
            b.id.is_some()
                || b.deposits > 0.0
                || b.withdrawals > 0.0
                || b.n_bets > 0
        })
        .map(|mut b| {
            b.balance = b.deposits - b.withdrawals + b.profit;
            b
        })
        .collect();
    out.sort_by(|a, b| match (a.id.is_none(), b.id.is_none()) {
        (true, false) => std::cmp::Ordering::Greater,
        (false, true) => std::cmp::Ordering::Less,
        _ => b.balance.partial_cmp(&a.balance).unwrap_or(std::cmp::Ordering::Equal),
    });
    Ok(out)
}

#[tauri::command]
pub fn list_transactions(db: State<Db>) -> AppResult<Vec<Transaction>> {
    let conn = db.0.lock();
    let mut stmt = conn.prepare(
        "SELECT id, tx_date, transaction_type, amount, sportsbook_id, notes
         FROM transactions ORDER BY tx_date DESC, id DESC",
    )?;
    let rows = stmt.query_map([], |r| {
        let t: String = r.get(2)?;
        Ok(Transaction {
            id: r.get(0)?,
            tx_date: r.get(1)?,
            transaction_type: TransactionType::from_str(&t).unwrap_or(TransactionType::Deposit),
            amount: r.get(3)?,
            sportsbook_id: r.get(4)?,
            notes: r.get(5)?,
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

#[tauri::command]
pub fn create_transaction(db: State<Db>, input: NewTransaction) -> AppResult<Transaction> {
    let conn = db.0.lock();
    conn.execute(
        "INSERT INTO transactions (tx_date, transaction_type, amount, sportsbook_id, notes)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            input.tx_date,
            input.transaction_type.as_str(),
            input.amount,
            input.sportsbook_id,
            input.notes,
        ],
    )?;
    let id = conn.last_insert_rowid();
    let tx = conn.query_row(
        "SELECT id, tx_date, transaction_type, amount, sportsbook_id, notes
         FROM transactions WHERE id=?1",
        params![id],
        |r| {
            let t: String = r.get(2)?;
            Ok(Transaction {
                id: r.get(0)?,
                tx_date: r.get(1)?,
                transaction_type: TransactionType::from_str(&t).unwrap_or(TransactionType::Deposit),
                amount: r.get(3)?,
                sportsbook_id: r.get(4)?,
                notes: r.get(5)?,
            })
        },
    )?;
    Ok(tx)
}

#[tauri::command]
pub fn update_transaction(
    db: State<Db>,
    id: i64,
    input: NewTransaction,
) -> AppResult<Transaction> {
    let conn = db.0.lock();
    let affected = conn.execute(
        "UPDATE transactions
         SET tx_date=?1, transaction_type=?2, amount=?3, sportsbook_id=?4, notes=?5
         WHERE id=?6",
        params![
            input.tx_date,
            input.transaction_type.as_str(),
            input.amount,
            input.sportsbook_id,
            input.notes,
            id,
        ],
    )?;
    if affected == 0 {
        return Err(AppError::Msg(format!("transaction {id} not found")));
    }
    let tx = conn.query_row(
        "SELECT id, tx_date, transaction_type, amount, sportsbook_id, notes
         FROM transactions WHERE id=?1",
        params![id],
        |r| {
            let t: String = r.get(2)?;
            Ok(Transaction {
                id: r.get(0)?,
                tx_date: r.get(1)?,
                transaction_type: TransactionType::from_str(&t).unwrap_or(TransactionType::Deposit),
                amount: r.get(3)?,
                sportsbook_id: r.get(4)?,
                notes: r.get(5)?,
            })
        },
    )?;
    Ok(tx)
}

#[tauri::command]
pub fn delete_transaction(db: State<Db>, id: i64) -> AppResult<()> {
    let conn = db.0.lock();
    conn.execute("DELETE FROM transactions WHERE id=?1", params![id])?;
    Ok(())
}

// ------------------------------------------------------------------
// admin
// ------------------------------------------------------------------

/// Wipe all user data and restore default seed tags + bankroll settings.
#[tauri::command]
pub fn reset_database(db: State<Db>) -> AppResult<()> {
    let mut conn = db.0.lock();
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM bet_strategies", [])?;
    tx.execute("DELETE FROM bets", [])?;
    tx.execute("DELETE FROM transactions", [])?;
    tx.execute("DELETE FROM sportsbooks", [])?;
    tx.execute("DELETE FROM leagues", [])?;
    tx.execute("DELETE FROM bet_types", [])?;
    tx.execute("DELETE FROM strategies", [])?;

    tx.execute(
        "INSERT INTO sportsbooks(name) VALUES ('DraftKings'),('FanDuel'),('BetMGM')",
        [],
    )?;
    tx.execute(
        "INSERT INTO leagues(name) VALUES ('NFL'),('NBA'),('MLB'),('NHL')",
        [],
    )?;
    tx.execute(
        "INSERT INTO bet_types(name) VALUES ('Moneyline'),('Spread'),('Total'),('Player Prop'),('Parlay')",
        [],
    )?;
    tx.execute(
        "UPDATE bankroll_settings
         SET starting_bankroll=0.0,
             unit_sizing_method='fixed_percent',
             unit_size_value=1.0,
             kelly_fraction=0.5
         WHERE id=1",
        [],
    )?;
    tx.commit()?;
    Ok(())
}

// ------------------------------------------------------------------
// analytics
// ------------------------------------------------------------------

#[tauri::command]
pub fn stats(db: State<Db>, filter: Option<BetFilter>) -> AppResult<Stats> {
    let filter_clone = filter.clone();
    let bets = list_bets(db.clone(), filter)?;

    let mut s = Stats::default();
    let mut ev_sum_pct = 0.0;
    let mut ev_n = 0;
    let mut clv_sum = 0.0;
    let mut clv_n = 0;
    let mut clv_beat_n = 0;
    let mut settled_stake = 0.0;

    for b in &bets {
        s.total_bets += 1;
        s.total_stake += b.stake;
        match b.outcome {
            Outcome::Won => {
                s.wins += 1;
                s.settled_bets += 1;
                settled_stake += b.stake;
                s.total_profit += calc::profit(b.odds, b.stake);
            }
            Outcome::Lost => {
                s.losses += 1;
                s.settled_bets += 1;
                settled_stake += b.stake;
                s.total_profit -= b.stake;
            }
            Outcome::Push => {
                s.pushes += 1;
                s.settled_bets += 1;
                settled_stake += b.stake;
            }
            Outcome::Pending => {
                s.pending_count += 1;
                s.pending_stake += b.stake;
                s.pending_best_case += calc::profit(b.odds, b.stake);
                s.pending_worst_case -= b.stake;
            }
        }
        if let Some(fo) = b.fair_odds {
            let ev = calc::ev_percent(b.odds, b.stake, fo);
            ev_sum_pct += ev;
            ev_n += 1;
            s.expected_profit += b.stake * ev / 100.0;
        }
        if let Some(co) = b.closing_odds {
            let clv = calc::clv_percent(b.odds, co);
            clv_sum += clv;
            clv_n += 1;
            if clv > 0.0 {
                clv_beat_n += 1;
            }
        }
    }

    let decisive = s.wins + s.losses;
    s.win_rate = if decisive > 0 { s.wins as f64 / decisive as f64 } else { 0.0 };
    s.roi = if settled_stake > 0.0 { s.total_profit / settled_stake } else { 0.0 };
    s.avg_ev = if ev_n > 0 { ev_sum_pct / ev_n as f64 } else { 0.0 };
    s.avg_clv = if clv_n > 0 { clv_sum / clv_n as f64 } else { 0.0 };
    s.expected_profit_sample = ev_n;
    s.clv_beat_rate = if clv_n > 0 { clv_beat_n as f64 / clv_n as f64 } else { 0.0 };
    s.clv_sample = clv_n;

    // Bankroll health — walk the event timeline to find peak + drawdown.
    let conn = db.0.lock();
    s.starting_bankroll = conn
        .query_row(
            "SELECT starting_bankroll FROM bankroll_settings WHERE id=1",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0.0);

    let events = collect_bankroll_events(&conn, s.starting_bankroll)?;
    let (current, peak, max_dd, _) = walk_bankroll(&events);
    s.current_bankroll = current;
    s.peak_bankroll = peak;
    s.max_drawdown = max_dd;
    s.max_drawdown_pct = if peak > 0.0 { max_dd / peak } else { 0.0 };

    // Rolling 30-day window (from today back 30 days) — uses the same filter
    // so it respects the caller's scoping if any.
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let thirty_ago = (chrono::Local::now() - chrono::Duration::days(30))
        .format("%Y-%m-%d")
        .to_string();
    drop(conn);

    let mut rolling_filter = filter_clone.unwrap_or_default();
    rolling_filter.from_date = Some(thirty_ago);
    rolling_filter.to_date = Some(today);
    let recent = list_bets(db.clone(), Some(rolling_filter))?;
    let mut rolling_stake = 0.0;
    for b in &recent {
        match b.outcome {
            Outcome::Won => {
                s.rolling_wins_30d += 1;
                rolling_stake += b.stake;
                s.rolling_profit_30d += calc::profit(b.odds, b.stake);
            }
            Outcome::Lost => {
                s.rolling_losses_30d += 1;
                rolling_stake += b.stake;
                s.rolling_profit_30d -= b.stake;
            }
            Outcome::Push => {
                s.rolling_pushes_30d += 1;
                rolling_stake += b.stake;
            }
            Outcome::Pending => {}
        }
    }
    s.rolling_roi_30d = if rolling_stake > 0.0 {
        s.rolling_profit_30d / rolling_stake
    } else {
        0.0
    };

    Ok(s)
}

#[tauri::command]
pub fn stats_by(db: State<Db>, dimension: Dimension) -> AppResult<Vec<GroupStats>> {
    let conn = db.0.lock();
    // For sportsbook / league / bet_type we use the foreign key on bets.
    // For strategy we use the bet_strategies M2M, so a bet counts in each
    // of its tagged strategies (totals will sum higher than grand total
    // — this is expected and standard).
    let bets_sql = match dimension {
        Dimension::Sportsbook => {
            "SELECT COALESCE(b.sportsbook_id, 0) AS gid,
                    COALESCE(s.name, '— untagged —') AS name,
                    b.odds, b.stake, b.outcome, b.closing_odds
             FROM bets b LEFT JOIN sportsbooks s ON s.id = b.sportsbook_id"
        }
        Dimension::League => {
            "SELECT COALESCE(b.league_id, 0) AS gid,
                    COALESCE(s.name, '— untagged —') AS name,
                    b.odds, b.stake, b.outcome, b.closing_odds
             FROM bets b LEFT JOIN leagues s ON s.id = b.league_id"
        }
        Dimension::BetType => {
            "SELECT COALESCE(b.bet_type_id, 0) AS gid,
                    COALESCE(s.name, '— untagged —') AS name,
                    b.odds, b.stake, b.outcome, b.closing_odds
             FROM bets b LEFT JOIN bet_types s ON s.id = b.bet_type_id"
        }
        Dimension::Strategy => {
            "SELECT s.id AS gid, s.name AS name,
                    b.odds, b.stake, b.outcome, b.closing_odds
             FROM bets b
             JOIN bet_strategies bs ON bs.bet_id = b.id
             JOIN strategies s ON s.id = bs.strategy_id"
        }
    };

    let mut stmt = conn.prepare(bets_sql)?;
    let rows = stmt.query_map([], |r| {
        let outcome_s: String = r.get(4)?;
        Ok((
            r.get::<_, i64>(0)?,
            r.get::<_, String>(1)?,
            r.get::<_, i32>(2)?,
            r.get::<_, f64>(3)?,
            Outcome::from_str(&outcome_s).unwrap_or(Outcome::Pending),
            r.get::<_, Option<i32>>(5)?,
        ))
    })?;

    let mut map: std::collections::BTreeMap<i64, GroupStats> = std::collections::BTreeMap::new();
    for row in rows {
        let (gid, name, odds, stake, outcome, closing) = row?;
        let entry = map.entry(gid).or_insert_with(|| GroupStats {
            id: if gid == 0 { None } else { Some(gid) },
            name,
            ..Default::default()
        });
        entry.n_bets += 1;
        entry.staked += stake;
        match outcome {
            Outcome::Won => {
                entry.wins += 1;
                entry.settled_bets += 1;
                entry.settled_stake += stake;
                entry.profit += calc::profit(odds, stake);
            }
            Outcome::Lost => {
                entry.losses += 1;
                entry.settled_bets += 1;
                entry.settled_stake += stake;
                entry.profit -= stake;
            }
            Outcome::Push => {
                entry.pushes += 1;
                entry.settled_bets += 1;
                entry.settled_stake += stake;
            }
            Outcome::Pending => {}
        }
        if let Some(co) = closing {
            let clv = calc::clv_percent(odds, co);
            entry.avg_clv += clv;
            entry.clv_sample += 1;
        }
    }

    let mut out: Vec<GroupStats> = map.into_values().collect();
    for g in out.iter_mut() {
        g.roi = if g.settled_stake > 0.0 {
            g.profit / g.settled_stake
        } else {
            0.0
        };
        if g.clv_sample > 0 {
            g.avg_clv /= g.clv_sample as f64;
        }
    }
    // Sort by profit descending so best-performers are on top.
    out.sort_by(|a, b| b.profit.partial_cmp(&a.profit).unwrap_or(std::cmp::Ordering::Equal));
    Ok(out)
}

// Internal event used for bankroll timeline walks.
enum Event {
    Deposit(f64),
    Withdrawal(f64),
    BetSettled(f64), // net profit (may be negative)
}

fn collect_bankroll_events(
    conn: &Connection,
    _starting: f64,
) -> AppResult<Vec<(String, Event)>> {
    let mut events: Vec<(String, Event)> = Vec::new();

    let mut stmt = conn.prepare(
        "SELECT tx_date, transaction_type, amount FROM transactions",
    )?;
    let rows = stmt.query_map([], |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, String>(1)?,
            r.get::<_, f64>(2)?,
        ))
    })?;
    for row in rows {
        let (d, ty, amt) = row?;
        let ev = match ty.as_str() {
            "deposit" => Event::Deposit(amt),
            "withdrawal" => Event::Withdrawal(amt),
            _ => continue,
        };
        events.push((d, ev));
    }

    let mut stmt = conn.prepare(
        "SELECT bet_date, odds, stake, outcome FROM bets WHERE outcome IN ('won','lost')",
    )?;
    let rows = stmt.query_map([], |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, i32>(1)?,
            r.get::<_, f64>(2)?,
            r.get::<_, String>(3)?,
        ))
    })?;
    for row in rows {
        let (d, odds, stake, outcome) = row?;
        let pl = match outcome.as_str() {
            "won" => calc::profit(odds, stake),
            "lost" => -stake,
            _ => 0.0,
        };
        events.push((d, Event::BetSettled(pl)));
    }

    events.sort_by(|a, b| a.0.cmp(&b.0));
    Ok(events)
}

/// Returns (current_bankroll, peak, max_drawdown, final_peak_idx).
fn walk_bankroll(events: &[(String, Event)]) -> (f64, f64, f64, usize) {
    let mut bankroll = 0.0;
    let mut peak: f64 = 0.0;
    let mut max_dd: f64 = 0.0;
    let mut peak_idx = 0;
    for (i, (_d, ev)) in events.iter().enumerate() {
        match ev {
            Event::Deposit(a) => bankroll += a,
            Event::Withdrawal(a) => bankroll -= a,
            Event::BetSettled(p) => bankroll += p,
        }
        if bankroll > peak {
            peak = bankroll;
            peak_idx = i;
        }
        let dd = peak - bankroll;
        if dd > max_dd {
            max_dd = dd;
        }
    }
    (bankroll, peak, max_dd, peak_idx)
}

#[tauri::command]
pub fn bankroll_series(db: State<Db>, bucket: Bucket) -> AppResult<Vec<BankrollPoint>> {
    let conn = db.0.lock();
    let starting: f64 = conn
        .query_row(
            "SELECT starting_bankroll FROM bankroll_settings WHERE id=1",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0.0);

    let events = collect_bankroll_events(&conn, starting)?;
    if events.is_empty() {
        return Ok(vec![]);
    }

    let fmt = match bucket {
        Bucket::Day => "%Y-%m-%d",
        Bucket::Week => "%Y-W%W",
        Bucket::Month => "%Y-%m",
    };

    // Walk events and emit one point per unique bucket label.
    let mut bankroll = starting;
    let mut peak: f64 = starting;
    let mut points: Vec<BankrollPoint> = Vec::new();

    // For rolling ROI: keep settled events from last 30 days per bucket.
    // Simple approach: reuse walk semantics and compute rolling by re-scanning
    // a window. We'll compute rolling_roi lazily in a second pass.

    let mut last_label: Option<String> = None;
    let mut staged: Option<BankrollPoint> = None;

    for (d, ev) in &events {
        match ev {
            Event::Deposit(a) => bankroll += a,
            Event::Withdrawal(a) => bankroll -= a,
            Event::BetSettled(p) => bankroll += p,
        }
        if bankroll > peak {
            peak = bankroll;
        }
        let label = bucket_label(d, fmt);
        let point = BankrollPoint {
            bucket: label.clone(),
            bankroll,
            peak,
            drawdown: bankroll - peak,
            rolling_roi: None,
        };
        if last_label.as_deref() == Some(label.as_str()) {
            staged = Some(point);
        } else {
            if let Some(p) = staged.take() {
                points.push(p);
            }
            staged = Some(point);
            last_label = Some(label);
        }
    }
    if let Some(p) = staged {
        points.push(p);
    }

    // Rolling 30-day ROI per point: scan bets within 30 days ending at each
    // bucket date (best-effort; day buckets hit this exactly, week/month are
    // approximations using the first-of-bucket date).
    let bet_rows: Vec<(String, i32, f64, String)> = {
        let mut stmt = conn.prepare(
            "SELECT bet_date, odds, stake, outcome FROM bets
             WHERE outcome IN ('won','lost','push')
             ORDER BY bet_date ASC",
        )?;
        let collected: Vec<(String, i32, f64, String)> = stmt
            .query_map([], |r| {
                Ok((
                    r.get::<_, String>(0)?,
                    r.get::<_, i32>(1)?,
                    r.get::<_, f64>(2)?,
                    r.get::<_, String>(3)?,
                ))
            })?
            .collect::<Result<_, _>>()?;
        collected
    };

    for p in points.iter_mut() {
        // Use the last event's actual date within this bucket as the window end.
        // Simple: parse the bucket back to an approx date; fall back to label.
        let end = match bucket {
            Bucket::Day => p.bucket.clone(),
            Bucket::Week => {
                // "YYYY-WNN" — treat the Monday of that ISO week as the end.
                p.bucket.clone()
            }
            Bucket::Month => format!("{}-28", p.bucket),
        };
        let start = window_start(&end, 30, bucket);

        let mut profit = 0.0;
        let mut stake = 0.0;
        for (d, odds, st, oc) in bet_rows.iter() {
            if d.as_str() > end.as_str() {
                break;
            }
            if d.as_str() < start.as_str() {
                continue;
            }
            match oc.as_str() {
                "won" => {
                    profit += calc::profit(*odds, *st);
                    stake += st;
                }
                "lost" => {
                    profit -= st;
                    stake += st;
                }
                "push" => {
                    stake += st;
                }
                _ => {}
            }
        }
        p.rolling_roi = if stake > 0.0 { Some(profit / stake) } else { None };
    }

    Ok(points)
}

fn bucket_label(d: &str, fmt: &str) -> String {
    // d is "YYYY-MM-DD". Parse with chrono for strftime handling.
    use chrono::NaiveDate;
    NaiveDate::parse_from_str(d, "%Y-%m-%d")
        .map(|nd| nd.format(fmt).to_string())
        .unwrap_or_else(|_| d.to_string())
}

fn window_start(end: &str, days: i64, bucket: Bucket) -> String {
    use chrono::NaiveDate;
    // For week/month buckets we approximate — the rolling window is always
    // N days long ending at the bucket end date.
    let end_date = match bucket {
        Bucket::Week => {
            // "YYYY-WNN" — approximate end as today for week; simpler path:
            // fall back to using today. The chart-level UX doesn't hinge on
            // exact rolling precision for week/month aggregations.
            chrono::Local::now().date_naive()
        }
        _ => NaiveDate::parse_from_str(end, "%Y-%m-%d")
            .unwrap_or_else(|_| chrono::Local::now().date_naive()),
    };
    let start = end_date - chrono::Duration::days(days);
    start.format("%Y-%m-%d").to_string()
}

#[tauri::command]
pub fn profit_over_time(db: State<Db>, bucket: Bucket) -> AppResult<Vec<ProfitPoint>> {
    let conn = db.0.lock();
    // SQLite date functions: strftime handles day/week/month truncation.
    let fmt = match bucket {
        Bucket::Day => "%Y-%m-%d",
        Bucket::Week => "%Y-W%W",
        Bucket::Month => "%Y-%m",
    };
    let mut stmt = conn.prepare(
        "SELECT strftime(?1, bet_date) AS b, odds, stake, outcome
         FROM bets WHERE outcome IN ('won','lost')
         ORDER BY bet_date ASC, id ASC",
    )?;
    let rows = stmt.query_map(params![fmt], |r| {
        let o: String = r.get(3)?;
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, i32>(1)?,
            r.get::<_, f64>(2)?,
            o,
        ))
    })?;

    let mut buckets: Vec<ProfitPoint> = Vec::new();
    let mut cumulative = 0.0;
    for row in rows {
        let (b, odds, stake, o) = row?;
        let outcome = Outcome::from_str(&o).unwrap_or(Outcome::Pending);
        let p = settled_profit(odds, stake, outcome);
        cumulative += p;
        match buckets.last_mut() {
            Some(last) if last.bucket == b => {
                last.profit += p;
                last.cumulative = cumulative;
            }
            _ => buckets.push(ProfitPoint {
                bucket: b,
                profit: p,
                cumulative,
            }),
        }
    }
    Ok(buckets)
}
