"use client";
import { FormEvent, useEffect, useState, useMemo } from "react";
import styles from "../map/map.module.css";

type District = { id: string; name: string; code: string };
type User = { id: string; name: string; email: string; role: string; districtIds: string[] };

function PaginatedTable({ title, data, columns, renderRow, searchPlaceholder }: any) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filtered = useMemo(() => {
    setCurrentPage(1);
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((item: any) => 
      Object.values(item).some(val => String(val).toLowerCase().includes(q))
    );
  }, [data, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const displayedStart = filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const displayedEnd = Math.min(currentPage * itemsPerPage, filtered.length);

  return (
    <section className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h2>{title}</h2>
        <div className={styles.searchWrapper}>
          <input type="text" className={styles.searchInput} placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr>{columns.map((c: string) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map(renderRow)
            ) : (
              <tr><td colSpan={columns.length} className={styles.emptyCell}>{data.length === 0 ? "Belum ada data yang ditambahkan." : "Tidak ada data yang cocok."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>Menampilkan {displayedStart}-{displayedEnd} dari {filtered.length} data</span>
          <div className={styles.paginationButtons}>
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className={styles.pageButton}>Sebelumnya</button>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className={styles.pageButton}>Selanjutnya</button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function ManagementPage() {
  const [districts, setDistricts] = useState<District[]>([]); const [users, setUsers] = useState<User[]>([]); const [error, setError] = useState("");
  const load = () => fetch("/api/admin/management").then(async (response) => {
    if (!response.ok) throw new Error("Gagal memuat");
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }).then((data) => { setDistricts(data.districts ?? []); setUsers(data.users ?? []); }).catch(() => setError("Data manajemen tidak dapat dimuat."));
  useEffect(() => { void load(); }, []);
  
  async function submit(event: FormEvent<HTMLFormElement>, kind: "district" | "user") { 
    event.preventDefault(); 
    const formElement = event.currentTarget;
    const form = new FormData(formElement); 
    const response = await fetch("/api/admin/management", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, ...Object.fromEntries(form) }) }); 
    if (!response.ok) {
      try {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        setError(data.error ?? "Gagal menyimpan data.");
      } catch (err) {
        setError("Gagal menyimpan data. Terjadi kesalahan pada server.");
      }
    }
    else { formElement.reset(); setError(""); load(); } 
  }

  return (
    <main className={styles.page}>
      <a className={styles.back} href="/dashboard">← Kembali ke dashboard</a>
      <h1>Manajemen wilayah & akun</h1>
      <p>Daftarkan kecamatan, admin kecamatan, dan OPD pelaksana.</p>
      
      {error && <div style={{ color: "#d95848", background: "#fff0ed", padding: "12px 16px", borderRadius: "6px", marginBottom: "24px", fontWeight: "bold", border: "1px solid #fad2cb" }}>{error}</div>}
      
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px", marginBottom: "12px" }}>
        <form onSubmit={(event) => submit(event, "district")}>
          <h2>Tambah kecamatan</h2>
          <input name="name" placeholder="Nama kecamatan" required />
          <input name="code" placeholder="Kode, mis. SUKAMAJU" required />
          <button>Tambah kecamatan</button>
        </form>
        
        <form onSubmit={(event) => submit(event, "user")}>
          <h2>Tambah akun pelaksana</h2>
          <input name="name" placeholder="Nama lengkap" required />
          <input name="email" type="email" placeholder="email@instansi.go.id" required />
          <input name="password" type="password" minLength={8} placeholder="Password minimal 8 karakter" required />
          <select name="role" required defaultValue="">
            <option value="" disabled>Pilih peran</option>
            <option value="CAMAT">Admin kecamatan</option>
            <option value="OPD">OPD pelaksana</option>
          </select>
          <select name="districtId" required defaultValue="">
            <option value="" disabled>Pilih kecamatan</option>
            {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
          </select>
          <button>Tambah akun</button>
        </form>
      </section>

      <PaginatedTable 
        title="Daftar Kecamatan"
        data={districts}
        columns={["Nama Kecamatan", "Kode"]}
        searchPlaceholder="Cari nama atau kode kecamatan..."
        renderRow={(d: District) => (
          <tr key={d.id}>
            <td className={styles.codeLink}>{d.name}</td>
            <td>{d.code}</td>
          </tr>
        )}
      />

      <PaginatedTable 
        title="Daftar Akun Pengguna"
        data={users}
        columns={["Nama Lengkap", "Role", "Email", "Kecamatan Terkait"]}
        searchPlaceholder="Cari nama, role, atau email..."
        renderRow={(u: User) => (
          <tr key={u.id}>
            <td className={styles.codeLink}>{u.name}</td>
            <td>
              <span className={`${styles.badge} ${u.role === 'ADMIN' ? styles.badgeHigh : u.role === 'CAMAT' ? styles.badgeMedium : styles.badgeLow}`}>
                {u.role}
              </span>
            </td>
            <td>{u.email}</td>
            <td>{u.districtIds?.length > 0 ? districts.find(d => d.id === u.districtIds[0])?.name ?? "-" : "-"}</td>
          </tr>
        )}
      />

      <style jsx>{`
        form { display: grid; gap: 12px; padding: 24px; border: 1px solid #d7e0dc; border-radius: 9px; background: #fff; box-shadow: 0 4px 20px rgba(7, 29, 54, 0.03); align-content: start; }
        input, select, button { padding: 12px 16px; border: 1px solid #ccd7d3; border-radius: 6px; font-size: 13px; background: #fff; color: #102a45; outline: none; transition: border-color 0.2s; }
        input:focus, select:focus { border-color: #2979ff; }
        button { border: 0; background: #0b2b4b; color: #fff; cursor: pointer; font-weight: 700; }
        button:hover { background: #133a62; }
        h2 { margin: 0 0 16px; font-family: var(--font-display), sans-serif; font-size: 20px; letter-spacing: -0.02em; color: #102a45; }
      `}</style>
    </main>
  );
}
