'use client'

import { useState } from 'react';
import Link from 'next/link';
import styles from '@/src/styles/auth.module.css';
import { loginAction } from '@/src/features/auth/actions/authActions';

export const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Enter your credentials to access your account</p>
        </div>
        
        {error && <div style={{ color: '#ef4444', textAlign: 'center', fontWeight: '500' }}>{error}</div>}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input 
              id="email" 
              name="email"
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
              name="password"
              type="password" 
              className={styles.input} 
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className={styles.button}>
            Sign In
          </button>
        </form>
        
        <div className={styles.footer}>
          <span>Don't have an account? </span>
          <Link href="/register" className={styles.link}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
