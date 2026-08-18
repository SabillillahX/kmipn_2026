import LoginForm from "./login-form";
import styles from "./login.module.css";

export default function LoginPage() {
  return <main className={styles.page}><section className={styles.card}><p>PORTAL INTERNAL SPLIK</p><h1>Masuk ke<br /><em>pusat kendali.</em></h1><span>Gunakan akun admin yang telah didaftarkan.</span><LoginForm /></section></main>;
}
