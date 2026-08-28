"use client";

import { CheckCircle, Warning, XCircle, Info, ShieldWarning } from "@phosphor-icons/react";
import styles from "./confirm-modal.module.css";

export type ModalType = "confirm" | "success" | "error" | "warning" | "info";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  isLoading?: boolean;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  type = "confirm",
  isLoading = false,
}: Props) {
  if (!isOpen) return null;

  const isAlertOnly = !onConfirm || type === "success" || type === "error" || type === "info";

  const renderIcon = () => {
    switch (type) {
      case "success":
        return (
          <div className={`${styles.iconWrapper} ${styles.iconSuccess}`}>
            <CheckCircle size={36} weight="fill" />
          </div>
        );
      case "error":
        return (
          <div className={`${styles.iconWrapper} ${styles.iconError}`}>
            <XCircle size={36} weight="fill" />
          </div>
        );
      case "warning":
        return (
          <div className={`${styles.iconWrapper} ${styles.iconWarning}`}>
            <Warning size={36} weight="fill" />
          </div>
        );
      case "info":
        return (
          <div className={`${styles.iconWrapper} ${styles.iconInfo}`}>
            <Info size={36} weight="fill" />
          </div>
        );
      case "confirm":
      default:
        return (
          <div className={`${styles.iconWrapper} ${styles.iconConfirm}`}>
            <ShieldWarning size={36} weight="duotone" />
          </div>
        );
    }
  };

  const getConfirmStyle = () => {
    if (type === "error") return styles.confirmRed;
    if (type === "success") return styles.confirmGreen;
    return styles.confirmBlue;
  };

  const handleConfirmClick = async () => {
    if (onConfirm) {
      await onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {renderIcon()}

        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.actions}>
          {!isAlertOnly && (
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className={`${styles.btnConfirm} ${getConfirmStyle()}`}
            onClick={handleConfirmClick}
            disabled={isLoading}
          >
            {isLoading ? "Memproses…" : isAlertOnly ? "Mengerti" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
