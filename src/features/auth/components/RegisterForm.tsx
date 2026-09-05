import Link from 'next/link';
import styles from '@/src/styles/auth.module.css';

export const RegisterForm = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join us today and unlock premium features</p>
        </div>
        
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>Full Name</label>
            <input 
              id="name" 
              type="text" 
              className={styles.input} 
              placeholder="John Doe"
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input 
              id="email" 
              type="email" 
              className={styles.input} 
              placeholder="name@example.com"
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input 
              id="password" 
              type="password" 
              className={styles.input} 
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className={styles.button}>
            Sign Up
          </button>
        </form>
        
        <div className={styles.footer}>
          <span>Already have an account? </span>
          <Link href="/login" className={styles.link}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
