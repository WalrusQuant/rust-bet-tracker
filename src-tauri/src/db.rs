use crate::error::AppResult;
use parking_lot::Mutex;
use rusqlite::Connection;
use std::path::Path;

pub struct Db(pub Mutex<Connection>);

impl Db {
    pub fn open(path: &Path) -> AppResult<Self> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        let db = Db(Mutex::new(conn));
        db.migrate()?;
        Ok(db)
    }

    fn migrate(&self) -> AppResult<()> {
        let migrations: &[(u32, &str)] = &[(1, include_str!("../migrations/001_init.sql"))];

        let mut conn = self.0.lock();
        let current: u32 = conn
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap_or(0);

        for (version, sql) in migrations {
            if *version > current {
                let tx = conn.transaction()?;
                tx.execute_batch(sql)?;
                tx.pragma_update(None, "user_version", *version)?;
                tx.commit()?;
                log::info!("applied migration {version}");
            }
        }
        Ok(())
    }
}

/// Escape a SQL identifier (wrap in double quotes, double any internal quotes).
/// Only used when we've already validated the identifier comes from a trusted enum.
pub fn quote_ident(name: &str) -> String {
    format!("\"{}\"", name.replace('"', "\"\""))
}
