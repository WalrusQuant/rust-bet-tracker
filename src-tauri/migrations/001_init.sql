CREATE TABLE sportsbooks (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE leagues (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE bet_types (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE strategies (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE bets (
  id            INTEGER PRIMARY KEY,
  bet_date      TEXT    NOT NULL,
  sportsbook_id INTEGER REFERENCES sportsbooks(id) ON DELETE SET NULL,
  league_id     INTEGER REFERENCES leagues(id)     ON DELETE SET NULL,
  bet_type_id   INTEGER REFERENCES bet_types(id)   ON DELETE SET NULL,
  odds          INTEGER NOT NULL,
  fair_odds     INTEGER,
  closing_odds  INTEGER,
  stake         REAL    NOT NULL,
  outcome       TEXT    NOT NULL CHECK(outcome IN ('pending','won','lost','push')),
  notes         TEXT,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bet_strategies (
  bet_id      INTEGER NOT NULL REFERENCES bets(id)       ON DELETE CASCADE,
  strategy_id INTEGER NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  PRIMARY KEY (bet_id, strategy_id)
);

CREATE TABLE bankroll_settings (
  id                 INTEGER PRIMARY KEY CHECK (id = 1),
  starting_bankroll  REAL    NOT NULL,
  unit_sizing_method TEXT    NOT NULL CHECK (unit_sizing_method IN ('fixed_percent','kelly','fixed_amount')),
  unit_size_value    REAL    NOT NULL,
  kelly_fraction     REAL    NOT NULL DEFAULT 1.0
);

CREATE TABLE transactions (
  id               INTEGER PRIMARY KEY,
  tx_date          TEXT    NOT NULL,
  transaction_type TEXT    NOT NULL CHECK (transaction_type IN ('deposit','withdrawal')),
  amount           REAL    NOT NULL,
  sportsbook_id    INTEGER REFERENCES sportsbooks(id) ON DELETE SET NULL,
  notes            TEXT
);

CREATE INDEX idx_bets_date    ON bets(bet_date DESC);
CREATE INDEX idx_bets_outcome ON bets(outcome);

-- Seed defaults
INSERT INTO sportsbooks(name) VALUES ('DraftKings'),('FanDuel'),('BetMGM');
INSERT INTO leagues(name)     VALUES ('NFL'),('NBA'),('MLB'),('NHL');
INSERT INTO bet_types(name)   VALUES ('Moneyline'),('Spread'),('Total'),('Player Prop'),('Parlay');

INSERT INTO bankroll_settings(id, starting_bankroll, unit_sizing_method, unit_size_value, kelly_fraction)
VALUES (1, 0.0, 'fixed_percent', 1.0, 0.5);
