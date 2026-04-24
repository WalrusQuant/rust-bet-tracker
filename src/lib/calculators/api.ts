import { invoke } from "@tauri-apps/api/core";
import type {
  AltLineInput, AltLineOutput,
  ArbitrageInput, ArbitrageOutput,
  BayesianInput, BayesianOutput,
  BetterLineInput, BetterLineOutput,
  ClvInput, ClvOutput,
  DevigInput, DevigOutput,
  EVInput, EVOutput,
  HedgeInput, HedgeOutput,
  HoldInput, HoldOutput,
  KellyInput, KellyOutput,
  MatchOutput,
  MiddleInput, MiddleOutput,
  NBinomMatchInput,
  OddsConvertInput, OddsConvertOutput,
  ParlayInput, ParlayOutput,
  PoissonMatchInput,
  PropSimInput, PropSimOutput,
  RegressionInput, RegressionOutput,
  RuinInput, RuinOutput,
  SharpImpliedInput, SharpImpliedOutput,
  TeaserInput, TeaserOutput,
  VigBookResult, VigCompareInput,
} from "./types";

export const calcApi = {
  oddsConvert: (input: OddsConvertInput) =>
    invoke<OddsConvertOutput>("calc_odds_convert", { input }),
  sharpImplied: (input: SharpImpliedInput) =>
    invoke<SharpImpliedOutput>("calc_sharp_implied", { input }),
  devig: (input: DevigInput) =>
    invoke<DevigOutput>("calc_devig", { input }),
  ev: (input: EVInput) =>
    invoke<EVOutput>("calc_ev", { input }),
  kelly: (input: KellyInput) =>
    invoke<KellyOutput>("calc_kelly", { input }),
  parlay: (input: ParlayInput) =>
    invoke<ParlayOutput>("calc_parlay", { input }),
  arbitrage: (input: ArbitrageInput) =>
    invoke<ArbitrageOutput>("calc_arbitrage", { input }),
  hedge: (input: HedgeInput) =>
    invoke<HedgeOutput>("calc_hedge", { input }),
  clv: (input: ClvInput) =>
    invoke<ClvOutput>("calc_clv", { input }),
  hold: (input: HoldInput) =>
    invoke<HoldOutput>("calc_hold", { input }),
  vigCompare: (input: VigCompareInput) =>
    invoke<VigBookResult[]>("calc_vig_compare", { input }),
  riskOfRuin: (input: RuinInput) =>
    invoke<RuinOutput>("calc_risk_of_ruin", { input }),
  bayesian: (input: BayesianInput) =>
    invoke<BayesianOutput>("calc_bayesian", { input }),
  regression: (input: RegressionInput) =>
    invoke<RegressionOutput>("calc_regression", { input }),
  betterLine: (input: BetterLineInput) =>
    invoke<BetterLineOutput>("calc_better_line", { input }),
  altLine: (input: AltLineInput) =>
    invoke<AltLineOutput>("calc_alt_line", { input }),
  middle: (input: MiddleInput) =>
    invoke<MiddleOutput>("calc_middle", { input }),
  teaser: (input: TeaserInput) =>
    invoke<TeaserOutput>("calc_teaser", { input }),
  poissonMatch: (input: PoissonMatchInput) =>
    invoke<MatchOutput>("calc_poisson_match", { input }),
  nbinomMatch: (input: NBinomMatchInput) =>
    invoke<MatchOutput>("calc_nbinom_match", { input }),
  propSim: (input: PropSimInput) =>
    invoke<PropSimOutput>("calc_prop_sim", { input }),
};
