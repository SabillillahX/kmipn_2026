"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./map.module.css";

type Point = {
  id: string;
  code: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  priority: string;
  status: string;
};

type LeafletMap = {
  fitBounds(bounds: unknown, options: { padding: [number, number]; maxZoom: number }): void;
  remove(): void;
  setView(center: [number, number], zoom: number): void;
};

type LeafletMarker = {
  addTo(map: LeafletMap): LeafletMarker;
  bindPopup(content: HTMLElement): LeafletMarker;
};

type LeafletApi = {
  map(element: HTMLElement, options: { zoomControl: boolean }): LeafletMap;
  tileLayer(url: string, options: { maxZoom: number; attribution: string }): { addTo(map: LeafletMap): void };
  marker(latlng: [number, number], options: { icon: unknown; title: string }): LeafletMarker;
  divIcon(options: { className: string; html: string; iconSize: [number, number]; iconAnchor: [number, number]; popupAnchor: [number, number] }): unknown;
  latLngBounds(points: Array<[number, number]>): unknown;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

export default function MapClient({ points }: { points: Point[] }) {
  const container = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);

  // Filter out completed tickets (status === 'selesai' / 'SELESAI')
  const activePoints = points.filter(
    (p) => p.status.toLowerCase() !== "selesai" && p.status !== "SELESAI"
  );

  const initialize = useCallback(() => {
    if (!window.L || !container.current || mapInstance.current) return;
    const L = window.L;
    const map = L.map(container.current, { zoomControl: true });
    mapInstance.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // If no active points exist (or all tasks are completed), display clean district map without pin points
    if (!activePoints.length) {
      map.setView([-7.0658, 110.42918], 13);
      setReady(true);
      return;
    }

    const bounds: Array<[number, number]> = [];
    activePoints.forEach((point, index) => {
      bounds.push([point.latitude, point.longitude]);
      const color =
        point.priority === "tinggi" ? "#ff6b57" : point.priority === "sedang" ? "#e8b85c" : "#43b993";

      const icon = L.divIcon({
        className: styles.markerShell,
        html: `<span style="background:${color}"><b>${index + 1}</b></span>`,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -37],
      });

      const popup = document.createElement("div");
      popup.className = styles.popup;
      const code = document.createElement("b");
      code.textContent = point.code;
      const category = document.createElement("small");
      category.textContent = `${point.category} · ${point.status}`;
      const description = document.createElement("p");
      description.textContent = point.description;
      const link = document.createElement("a");
      link.href = `/dashboard/laporan/${encodeURIComponent(point.code)}`;
      link.textContent = "Tangani penugasan →";
      popup.append(code, category, description, link);

      L.marker([point.latitude, point.longitude], { icon, title: point.code })
        .addTo(map)
        .bindPopup(popup);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(bounds), { padding: [44, 44], maxZoom: 15 });
    }

    setReady(true);
  }, [activePoints]);

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
        {!ready && <div className={styles.loading}>Memuat peta wilayah penugasan…</div>}
      </div>
    </>
  );
}
