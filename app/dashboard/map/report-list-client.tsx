"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  contactPhone: string;
  createdAt: string;
};

export default function ReportListClient({ points }: { points: Point[] }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day} ${month} ${year}, ${hours}.${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const filteredPoints = useMemo(() => {
    const query = search.trim().toLowerCase();
    setCurrentPage(1);
    if (!query) return points;

    return points.filter((point) => {
      const codeMatch = point.code.toLowerCase().includes(query);
      const contactMatch = point.contactPhone.toLowerCase().includes(query);
      const descMatch = point.description.toLowerCase().includes(query);
      const priorityMatch = point.priority.toLowerCase().includes(query);
      const formattedDate = formatDate(point.createdAt).toLowerCase();
      const dateMatch = formattedDate.includes(query);
      
      return codeMatch || contactMatch || descMatch || priorityMatch || dateMatch;
    });
  }, [points, search]);

  const totalPages = Math.ceil(filteredPoints.length / itemsPerPage);
  
  const paginatedPoints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPoints.slice(start, end);
  }, [filteredPoints, currentPage]);

  const displayedStart = filteredPoints.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const displayedEnd = Math.min(currentPage * itemsPerPage, filteredPoints.length);

  return (
    <section className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h2>Daftar Aduan Masuk</h2>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Cari kode, kontak, tanggal, tingkat kerusakan, deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Kontak</th>
              <th>Tanggal</th>
              <th>Tingkat Kerusakan</th>
              <th>Deskripsi Aduan</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPoints.length > 0 ? (
              paginatedPoints.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/dashboard/laporan/${item.code}`} className={styles.codeLink}>
                      {item.code}
                    </Link>
                  </td>
                  <td>{item.contactPhone}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        item.priority === "tinggi"
                          ? styles.badgeHigh
                          : item.priority === "sedang"
                          ? styles.badgeMedium
                          : styles.badgeLow
                      }`}
                    >
                      {item.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.descCell}>{item.description}</td>
                </tr>
              ))
            ) : points.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell} style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                  Sedang tidak ada laporan masuk.
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  Tidak ada aduan yang cocok dengan pencarian Anda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredPoints.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Menampilkan {displayedStart}-{displayedEnd} dari {filteredPoints.length} aduan
          </span>
          <div className={styles.paginationButtons}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={styles.pageButton}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
