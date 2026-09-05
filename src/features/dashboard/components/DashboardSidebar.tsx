"use client";

import React, { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import splikEmblem from "../../../../public/brand/splik-emblem.png";
import {
  SquaresFourIcon,
  ListDashesIcon,
  ChartBarIcon,
  GearIcon,
  SignOutIcon,
  CaretLeftIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import styles from "@/src/styles/dashboard.module.css";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const DashboardSidebar = ({
  isCollapsed,
  onToggle,
}: DashboardSidebarProps) => {
  const pathname = usePathname();
  const isEksekutif = pathname === "/dashboard";
  const isOpd = pathname === "/dashboard/opd";

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}
    >
      <div className={styles.sidebarTop}>
        <div className={styles.sidebarBrand}>
          <Image
            src={splikEmblem}
            alt=""
            width={36}
            height={36}
            className={styles.brandLogo}
          />
          {!isCollapsed && <strong>Distrac</strong>}
        </div>

        <Button
          variant="outline"
          size="icon"
          className={`h-8 w-8 z-10 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          onClick={onToggle}
          aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          <CaretLeftIcon size={16} weight="bold" />
        </Button>
      </div>

      <nav className={styles.nav}>
        <a
          href="/dashboard"
          className={`${styles.navItem} ${isEksekutif ? styles.active : ""}`}
          title="Dashboard Eksekutif"
        >
          <SquaresFourIcon size={20} />
          {!isCollapsed && "Dashboard Eksekutif"}
        </a>
        <a
          href="/dashboard/opd"
          className={`${styles.navItem} ${isOpd ? styles.active : ""}`}
          title="Antrean Disposisi"
        >
          <ListDashesIcon size={20} />
          {!isCollapsed && "Antrean Disposisi"}
        </a>
        <div className={styles.navItem} title="Laporan Kinerja">
          <ChartBarIcon size={20} />
          {!isCollapsed && "Laporan Kinerja"}
        </div>
        <div className={styles.navItem} title="Pengaturan">
          <GearIcon size={20} />
          {!isCollapsed && "Pengaturan"}
        </div>
      </nav>

      <div className={styles.userProfile}>
        <Avatar className="h-10 w-10">
          <AvatarFallback className="font-bold">B</AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Budi Santoso</span>
              <span className={styles.userRole}>Dinas Bina Marga</span>
            </div>
            <SignOutIcon
              size={20}
              style={{ marginLeft: "auto", cursor: "pointer" }}
            />
          </>
        )}
      </div>
    </aside>
  );
};
