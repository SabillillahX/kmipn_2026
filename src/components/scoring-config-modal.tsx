"use client";

import { useState, useEffect } from "react";
import { Sliders, CheckCircle, X, FloppyDisk, ChartLineUp, ShieldWarning, House } from "@phosphor-icons/react";

interface DistrictConfig {
  id: string;
  name: string;
  code: string;
  alpha: number;
  beta: number;
  povertyRate: number;
  vulnerabilityIndex: number;
  isDisasterProne: boolean;
  dtksRecipientDensity: number;
  populationDensity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ScoringConfigModal({ isOpen, onClose, onSaved }: Props) {
  const [districts, setDistricts] = useState<DistrictConfig[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const [alpha, setAlpha] = useState<number>(0.6);
  const [beta, setBeta] = useState<number>(0.4);
  const [povertyRate, setPovertyRate] = useState<number>(15);
  const [vulnerabilityIndex, setVulnerabilityIndex] = useState<number>(50);
  const [isDisasterProne, setIsDisasterProne] = useState<boolean>(false);
  const [dtksRecipientDensity, setDtksRecipientDensity] = useState<number>(20);
  const [populationDensity, setPopulationDensity] = useState<number>(1000);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/scoring-config");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setDistricts(data.data);
        const first = data.data[0];
        setSelectedDistrictId(first.id);
        populateDistrictFields(first);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const populateDistrictFields = (dist: DistrictConfig) => {
    setAlpha(dist.alpha);
    setBeta(dist.beta);
    setPovertyRate(Math.round(dist.povertyRate * 100));
    setVulnerabilityIndex(dist.vulnerabilityIndex);
    setIsDisasterProne(dist.isDisasterProne);
    setDtksRecipientDensity(dist.dtksRecipientDensity);
    setPopulationDensity(dist.populationDensity);
  };

  const handleDistrictChange = (id: string) => {
    setSelectedDistrictId(id);
    const dist = districts.find((d) => d.id === id);
    if (dist) {
      populateDistrictFields(dist);
    }
  };

  const handleAlphaSlider = (val: number) => {
    const a = Math.round(val * 100) / 100;
    const b = Math.round((1 - a) * 100) / 100;
    setAlpha(a);
    setBeta(b);
  };

  const applyPreset = (presetType: "URBAN" | "RURAL") => {
    if (presetType === "URBAN") {
      setAlpha(0.6);
      setBeta(0.4);
    } else {
      setAlpha(0.4);
      setBeta(0.6);
    }
  };

  const handleSave = async () => {
    if (!selectedDistrictId) return;
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch("/api/admin/scoring-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtId: selectedDistrictId,
          alpha,
          beta,
          povertyRate: povertyRate / 100,
          vulnerabilityIndex,
          isDisasterProne,
          dtksRecipientDensity,
          populationDensity,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Kalibrasi penilaian prioritas berhasil disimpan!");
        if (onSaved) onSaved();
        setTimeout(() => {
          setMessage(null);
          onClose();
        }, 1500);
      } else {
        setMessage(data.error || "Gagal menyimpan konfigurasi");
      }
    } catch (err: any) {
      setMessage(err.message || "Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(6px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "680px",
        color: "#f8fafc",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh"
      }}>
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#2563eb20",
              border: "1px solid #2563eb40",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6"
            }}>
              <Sliders size={22} weight="bold" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Kalibrasi Mesin Penilaian Prioritas</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>Configurable Weighted Scoring Matrix (SU = α·SA + β·SB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px"
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {message && (
            <div style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              backgroundColor: message.includes("berhasil") ? "#16653430" : "#991b1b30",
              border: `1px solid ${message.includes("berhasil") ? "#22c55e" : "#ef4444"}`,
              color: message.includes("berhasil") ? "#4ade80" : "#fca5a5",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <CheckCircle size={18} />
              {message}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
              Pilih Wilayah Kecamatan
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => handleDistrictChange(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "8px",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none"
              }}
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{
            backgroundColor: "#1e293b50",
            border: "1px solid #334155",
            borderRadius: "12px",
            padding: "1rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc" }}>Bobot Matriks Prioritas (α + β = 100%)</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => applyPreset("URBAN")}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #3b82f6",
                    backgroundColor: alpha === 0.6 ? "#2563eb" : "transparent",
                    color: "#f8fafc",
                    cursor: "pointer"
                  }}
                >
                  Perkotaan (60/40)
                </button>
                <button
                  onClick={() => applyPreset("RURAL")}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #eab308",
                    backgroundColor: alpha === 0.4 ? "#ca8a04" : "transparent",
                    color: "#f8fafc",
                    cursor: "pointer"
                  }}
                >
                  Pinggiran (40/60)
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  <span style={{ color: "#60a5fa" }}>α (Teknis Dampak SA): {Math.round(alpha * 100)}%</span>
                  <span style={{ color: "#facc15" }}>β (Sosio-Demografis SB): {Math.round(beta * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={alpha}
                  onChange={(e) => handleAlphaSlider(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{
              backgroundColor: "#1e293b30",
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "0.85rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#38bdf8", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                <ChartLineUp size={16} /> Lapisan 1: Data Makro BPS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Persentase Kemiskinan (%)</label>
                  <input
                    type="number"
                    value={povertyRate}
                    onChange={(e) => setPovertyRate(parseFloat(e.target.value) || 0)}
                    style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Indeks Kerentanan Wilayah (0-100)</label>
                  <input
                    type="number"
                    value={vulnerabilityIndex}
                    onChange={(e) => setVulnerabilityIndex(parseFloat(e.target.value) || 0)}
                    style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff", fontSize: "0.85rem" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                  <input
                    type="checkbox"
                    id="disasterProne"
                    checked={isDisasterProne}
                    onChange={(e) => setIsDisasterProne(e.target.checked)}
                    style={{ accentColor: "#ef4444" }}
                  />
                  <label htmlFor="disasterProne" style={{ fontSize: "0.75rem", color: "#cbd5e1", cursor: "pointer" }}>Status Rawan Bencana</label>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: "#1e293b30",
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "0.85rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#a855f7", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                <House size={16} /> Lapisan 2: Data Mikro DTKS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Penerima Bansos per km²</label>
                  <input
                    type="number"
                    value={dtksRecipientDensity}
                    onChange={(e) => setDtksRecipientDensity(parseFloat(e.target.value) || 0)}
                    style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Kepadatan Penduduk (jiwa/km²)</label>
                  <input
                    type="number"
                    value={populationDensity}
                    onChange={(e) => setPopulationDensity(parseFloat(e.target.value) || 0)}
                    style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff", fontSize: "0.85rem" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid #1e293b",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          backgroundColor: "#0f172a"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: "transparent",
              border: "1px solid #334155",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "0.875rem"
            }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              border: "none",
              color: "#ffffff",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <FloppyDisk size={18} />
            {saving ? "Menyimpan..." : "Simpan & Kalibrasi"}
          </button>
        </div>
      </div>
    </div>
  );
}
