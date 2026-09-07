import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { KarmaProfile } from "../api";

interface CivicKarmaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CivicKarmaModal: React.FC<CivicKarmaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [karma, setKarma] = useState<KarmaProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [redeemedToast, setRedeemedToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadKarma();
    }
  }, [isOpen]);

  const loadKarma = async () => {
    try {
      setLoading(true);
      const res = await api.getCitizenKarma();
      setKarma(res);
    } catch (err) {
      console.error("Failed to load karma:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = (perkTitle: string) => {
    setRedeemedToast(`🎉 Voucher redeemed! Check your registered email for ${perkTitle}.`);
    setTimeout(() => setRedeemedToast(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="modal-karma-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl font-bold">
              🌟
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="modal-karma-title" className="text-lg font-bold text-white tracking-wide">
                  Civic Karma & Community Rewards Leaderboard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Citizen Gamification
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Earn verified karma points by reporting potholes and hazardous infrastructure across Bhopal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {redeemedToast && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 animate-bounce">
              <span>🎁</span>
              <span>{redeemedToast}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
              <span className="animate-spin">🔄</span>
              <span>Loading civic score & badges...</span>
            </div>
          ) : karma ? (
            <>
              {/* Profile Card */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl">
                    🎖️
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">{karma.citizen_name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Rank #{karma.leaderboard_rank} Citywide
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                      {karma.tier}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {karma.verified_reports_count} Verified Municipal Reports • {karma.co2_reduction_kg} kg CO₂ Traffic Delay Saved
                    </p>
                  </div>
                </div>

                <div className="text-center md:text-right bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-800">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total Karma Points
                  </div>
                  <div className="text-3xl font-black text-emerald-400 mt-0.5">
                    {karma.karma_points}
                  </div>
                  <div className="text-[10px] text-emerald-300">+50 pts per verified report</div>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Reports Filed</div>
                  <div className="text-xl font-bold text-white mt-1">{karma.total_reports_submitted}</div>
                  <div className="text-[10px] text-slate-500">Citizen Reports</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">AI Verified</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{karma.verified_reports_count}</div>
                  <div className="text-[10px] text-slate-500">Accredited Anomalies</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Potholes Fixed</div>
                  <div className="text-xl font-bold text-cyan-400 mt-1">{karma.resolved_reports_count}</div>
                  <div className="text-[10px] text-slate-500">Repaired by PWD</div>
                </div>
              </div>

              {/* Redeemable Civic Perks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Redeem Civic Perks & Municipal Green Vouchers
                </h4>
                <div className="space-y-2">
                  {karma.available_perks.map((perk) => (
                    <div
                      key={perk.id}
                      className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">🎁</span>
                        <div>
                          <div className="text-xs font-bold text-white">{perk.title}</div>
                          <div className="text-[10px] text-slate-400">Requires {perk.cost_points} Karma Points</div>
                        </div>
                      </div>

                      {perk.cost_points <= karma.karma_points ? (
                        <button
                          onClick={() => handleRedeem(perk.title)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                        >
                          Redeem Voucher
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 text-xs font-medium border border-slate-700">
                          🔒 Need {perk.cost_points - karma.karma_points} more
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Citywide Contributor Leaderboard */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Top Bhopal Citizen Scouts (This Month)
                </h4>
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-700/60 overflow-hidden text-xs">
                  {[
                    { rank: 1, name: "Aarav Mehta (Ward 7)", points: 820, badge: "🥇 Grand Guardian" },
                    { rank: 2, name: "Priya Saxena (Ward 12)", points: 640, badge: "🥈 Master Scout" },
                    { rank: 3, name: "Vikram Chauhan (Ward 3)", points: 510, badge: "🥉 Pavement Sentinel" },
                    { rank: 14, name: "You (Citizen Scout #841)", points: karma.karma_points, badge: "🎖️ Active Scout" }
                  ].map((lead) => (
                    <div
                      key={lead.rank}
                      className={`p-2.5 flex items-center justify-between ${
                        lead.rank === 14 ? "bg-emerald-950/30 font-bold" : "bg-slate-900/40"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-slate-400 w-5">#{lead.rank}</span>
                        <span className="text-white">{lead.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] text-slate-400">{lead.badge}</span>
                        <span className="font-mono text-emerald-400 font-bold">{lead.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span>Points verified by UrbanIntel AI Civic Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
