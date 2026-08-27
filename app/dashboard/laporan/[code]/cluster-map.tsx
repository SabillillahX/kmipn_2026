"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./report-handler.module.css";

type SubReport = {
  id: string;
  code: string;
  reporterPhone: string;
  description: string;
  damageLevel: number;
  createdAt: string;
  latitude: number;
  longitude: number;
};

type LeafletMap = { fitBounds(bounds: unknown, options: { padding: [number, number]; maxZoom: number }): void; remove(): void };
type LeafletMarker = { addTo(map: LeafletMap): LeafletMarker; bindPopup(content: HTMLElement): LeafletMarker };
type LeafletApi = {
  map(element: HTMLElement, options: { zoomControl: boolean }): LeafletMap;
  tileLayer(url: string, options: { maxZoom: number; attribution: string }): { addTo(map: LeafletMap): void };
  marker(latlng: [number, number], options: { icon: unknown; title: string }): LeafletMarker;
  divIcon(options: { className: string; html: string; iconSize: [number, number]; iconAnchor: [number, number]; popupAnchor: [number, number] }): unknown;
  latLngBounds(points: Array<[number, number]>): unknown;
};

declare global { interface Window { L?: LeafletApi } }

export default function ClusterMapClient({ reports }: { reports: SubReport[] }) {
  const container = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);

  const initialize = useCallback(() => {
    if (!window.L || !container.current || mapInstance.current || !reports.length) return;
    const L = window.L;
    const map = L.map(container.current, { zoomControl: true });
    mapInstance.current = map;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const bounds: Array<[number, number]> = [];
    reports.forEach((item, index) => {
      bounds.push([item.latitude, item.longitude]);
      const color = item.damageLevel === 3 ? "#ff6b57" : item.damageLevel === 2 ? "#e8b85c" : "#43b993";
      const icon = L.divIcon({
        className: styles.markerShell,
        html: `<span style="background:${color}"><b>${index + 1}</b></span>`,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -37]
      });

      const popup = document.createElement("div");
      popup.className = styles.popup;
      const code = document.createElement("b");
      code.textContent = item.code;
      const meta = document.createElement("small");
      meta.textContent = `Kerusakan: ${item.damageLevel === 3 ? "Tinggi" : item.damageLevel === 2 ? "Sedang" : "Rendah"}`;
      const desc = document.createElement("p");
      desc.textContent = item.description;
      popup.append(code, meta, desc);

      L.marker([item.latitude, item.longitude], { icon, title: item.code })
        .addTo(map)
        .bindPopup(popup);
    });

    map.fitBounds(L.latLngBounds(bounds), { padding: [44, 44], maxZoom: 15 });
    setReady(true);
  }, [reports]);

  useEffect(() => {
    initialize();
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [initialize]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        strategy="afterInteractive"
        onReady={initialize}
      />
      <div className={styles.mapWrap}>
        <div ref={container} className={styles.map} />
        {!ready && <div className={styles.loading}>Memuat peta klaster…</div>}
      </div>
    </>
  );
}
