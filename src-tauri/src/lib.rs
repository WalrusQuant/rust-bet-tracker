mod calc;
mod calc_commands;
mod commands;
mod db;
mod error;
mod models;

use db::Db;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|app| {
            let dir = app
                .path()
                .app_data_dir()
                .expect("app_data_dir resolvable");
            let db_path = dir.join("bet-tracker.sqlite");
            let db = Db::open(&db_path).expect("database open");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_bets,
            commands::create_bet,
            commands::update_bet,
            commands::delete_bet,
            commands::settle_bet,
            commands::list_tags,
            commands::create_tag,
            commands::delete_tag,
            commands::get_bankroll_settings,
            commands::update_bankroll_settings,
            commands::current_bankroll,
            commands::recommended_stake,
            commands::list_transactions,
            commands::create_transaction,
            commands::update_transaction,
            commands::delete_transaction,
            commands::sportsbook_balances,
            calc_commands::calc_odds_convert,
            calc_commands::calc_sharp_implied,
            calc_commands::calc_devig,
            calc_commands::calc_ev,
            calc_commands::calc_kelly,
            calc_commands::calc_parlay,
            calc_commands::calc_arbitrage,
            calc_commands::calc_hedge,
            calc_commands::calc_clv,
            calc_commands::calc_hold,
            calc_commands::calc_vig_compare,
            calc_commands::calc_risk_of_ruin,
            calc_commands::calc_bayesian,
            calc_commands::calc_regression,
            calc_commands::calc_better_line,
            calc_commands::calc_alt_line,
            calc_commands::calc_middle,
            calc_commands::calc_teaser,
            calc_commands::calc_poisson_match,
            calc_commands::calc_nbinom_match,
            calc_commands::calc_prop_sim,
            commands::stats,
            commands::stats_by,
            commands::profit_over_time,
            commands::bankroll_series,
            commands::reset_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
