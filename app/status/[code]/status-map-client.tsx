"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../status.module.css";

type LeafletMap = { remove(): void };
type LeafletApi = {
  map(element: HTMLElement, options: { zoomControl: boolean }): LeafletMap;
  tileLayer(url: string, options: { maxZoom: number; attribution: string }): { addTo(map: LeafletMap): void };
  marker(latlng: [number, number], options: { icon: unknown; title: string }): { addTo(map: LeafletMap): void };
  divIcon(options: { className: string; html: string; iconSize: [number, number]; iconAnchor: [number, number] }): unknown;
};

export default function StatusMapClient({
  latitude,
  longitude,
  priority
}: {
  latitude: number;
  longitude: number;
  priority: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const initialize = useCallback(() => {
    const L = (window as any).L;
    if (!L || !container.current || mapInstance.current) return;
    const map = L.map(container.current, { zoomControl: true });
    mapInstance.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const color = priority === "tinggi" ? "#ff6b57" : priority === "sedang" ? "#e8b85c" : "#43b993";
    const icon = L.divIcon({
      className: "",
      html: `<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0ZM15 20.25C12.1005 20.25 9.75 17.8995 9.75 15C9.75 12.1005 12.1005 9.75 15 9.75C17.8995 9.75 20.25 12.1005 20.25 15C20.25 17.8995 17.8995 20.25 15 20.25Z" fill="${color}"/>
             </svg>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });

    L.marker([latitude, longitude], { icon, title: "Lokasi Laporan" }).addTo(map);
    (map as any).setView([latitude, longitude], 16);
    setReady(true);
  }, [latitude, longitude, priority]);

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
      <div className={styles.statusMapWrap}>
        <div ref={container} className={styles.statusMap} />
        {!ready && <div className={styles.loading}>Memuat peta lokasi…</div>}
      </div>
    </>
  );
}
