"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./status.module.css";

export default function StatusSearchPage() {
  const router = useRouter(); const [code, setCode] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); if (code.trim()) router.push(`/status/${encodeURIComponent(code.trim().toUpperCase())}`); }
  return <main className={styles.page}><section className={styles.searchCard}><Link href="/">← Kembali ke portal</Link><p>PELACAKAN LAPORAN</p><h1>Kawal suaramu<br /><em>sampai tuntas.</em></h1><span>Masukkan kode yang didapat setelah mengirim laporan.</span><form onSubmit={submit}><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Contoh: SPLIK-TEST003" aria-label="Kode laporan" /><button>Cek perjalanan laporan</button></form><small>Untuk pengujian, coba kode <b>SPLIK-TEST001</b> hingga <b>SPLIK-TEST010</b>.</small></section></main>;
}
