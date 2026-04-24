//! Betting-math primitives and full calculators. Pure — no I/O, no DB.
//!
//! Organized into submodules per topic. `pub use odds::*` keeps the flat
//! `crate::calc::american_to_decimal(...)` call sites working without churn
//! when modules are added/reorganized.

pub mod altline;
pub mod arbitrage;
pub mod bayesian;
pub mod bestline;
pub mod devig;
pub mod hedge;
pub mod hold;
pub mod middle;
pub mod nbinom;
pub mod odds;
pub mod parlay;
pub mod poisson;
pub mod probability;
pub mod prop_sim;
pub mod regression;
pub mod risk_of_ruin;
pub mod teaser_ev;
pub mod vig_comparison;

pub use odds::*;
