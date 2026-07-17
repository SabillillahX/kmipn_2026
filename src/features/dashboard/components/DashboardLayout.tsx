import React from 'react';
import styles from '@/src/styles/dashboard.module.css';

export const DashboardLayout = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Government Executive Dashboard</h1>
        <p className={styles.subtitle}>Overview of regional issues and queue assignments</p>
      </header>

      <div className={styles.grid}>
        {/* Top panels */}
        <div className={`${styles.panel} ${styles.col12}`}>
          <h2 className={styles.panelTitle}>Summary Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Tickets Received</div>
              <div className={styles.statValue}>1,284</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>In Progress</div>
              <div className={styles.statValue}>432</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Completed</div>
              <div className={styles.statValue}>852</div>
            </div>
          </div>
        </div>

        <div className={`${styles.panel} ${styles.col8}`}>
          <h2 className={styles.panelTitle}>Heatmap: Issue Concentration</h2>
          <div className={styles.imageMock}>
            <img 
              src="https://www.shutterstock.com/image-vector/heatmap-heat-map-color-scale-600nw-2475459385.jpg" 
              alt="Heatmap Mock" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
        </div>

        <div className={`${styles.panel} ${styles.col4}`}>
          <h2 className={styles.panelTitle}>Priority List (Top 10)</h2>
          <div className={styles.list}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.itemInfo}>
                  <span>Ticket #{2000 + i} - Infrastructure</span>
                  <span className={styles.itemScore}>Urgency: 9.{8 - i}</span>
                </div>
                <div className={styles.actions}>
                  <button className={`${styles.btn} ${styles.btnApprove}`}>Approve</button>
                  <button className={`${styles.btn} ${styles.btnReject}`}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.panel} ${styles.col6}`}>
          <h2 className={styles.panelTitle}>Lock Flag Management</h2>
          <div className={styles.imageMock}>
            <img 
              src="https://www.shutterstock.com/image-vector/city-map-navigation-smartphone-app-600nw-1830691517.jpg" 
              alt="Map Mock" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
        </div>

        <div className={`${styles.panel} ${styles.col6}`}>
          <h2 className={styles.panelTitle}>OPD Assignment Queue</h2>
          <div className={styles.queueGrid}>
            <div className={styles.queueCard}>
              <span className={styles.lockBadge}>Lock Flag Active</span>
              <strong>Jalan Rusak Ring Road</strong>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Coords: -7.25, 112.75</span>
              <img 
                src="https://www.shutterstock.com/image-photo/pothole-on-asphalt-road-600nw-1919854745.jpg" 
                alt="Pothole"
                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Similar tickets: 3 nearby</span>
            </div>
            
            <div className={styles.queueCard}>
              <strong>Saluran Air Mampet</strong>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Coords: -7.26, 112.76</span>
              <img 
                src="https://www.shutterstock.com/image-photo/clogged-street-drain-garbage-water-600nw-1941655114.jpg" 
                alt="Drain"
                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Similar tickets: 0 nearby</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
