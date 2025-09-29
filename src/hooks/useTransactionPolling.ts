import { useState, useCallback, useRef } from "react";

interface PendingTransaction {
  id: string;
  type: "consent" | "passport" | "data-sync" | "incentive";
  timestamp: number;
  accountId: string;
}

export const useTransactionPolling = () => {
  const [pendingTransactions, setPendingTransactions] = useState<
    PendingTransaction[]
  >([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addPendingTransaction = useCallback(
    (transaction: Omit<PendingTransaction, "timestamp">) => {
      const newTransaction: PendingTransaction = {
        ...transaction,
        timestamp: Date.now(),
      };

      setPendingTransactions((prev) => [...prev, newTransaction]);

      // Start polling if not already active
      if (!pollingIntervalRef.current) {
        startPolling();
      }
    },
    [],
  );

  const removePendingTransaction = useCallback(
    (transactionId: string) => {
      setPendingTransactions((prev) =>
        prev.filter((tx) => tx.id !== transactionId),
      );

      // Stop polling if no more pending transactions
      if (pendingTransactions.length <= 1) {
        stopPolling();
      }
    },
    [pendingTransactions.length],
  );

  const checkTransactionStatus = useCallback(
    async (transaction: PendingTransaction) => {
      try {
        // Check if transaction is older than 5 minutes (likely completed or failed)
        const isOld = Date.now() - transaction.timestamp > 5 * 60 * 1000;

        if (isOld) {
          removePendingTransaction(transaction.id);
          return;
        }

        // Check transaction status based on type
        let statusEndpoint = "";
        switch (transaction.type) {
          case "consent":
            statusEndpoint = `/consent?patientId=${transaction.accountId}&includeRevoked=true`;
            break;
          case "passport":
            statusEndpoint = `/consent/genomic-passport/status/${transaction.accountId}`;
            break;
          case "data-sync":
            statusEndpoint = `/consent/data-sync/status/${transaction.accountId}`;
            break;
          case "incentive":
            statusEndpoint = `/incentives/balance/${transaction.accountId}`;
            break;
          default:
            return;
        }

        const response = await fetch(
          `${process.env.REACT_APP_API_ROOT}${statusEndpoint}`,
        );

        if (response.ok) {
          // Transaction likely completed, remove from pending
          removePendingTransaction(transaction.id);
        }
      } catch (error) {
        console.error("Error checking transaction status:", error);
      }
    },
    [removePendingTransaction],
  );

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    pollingIntervalRef.current = setInterval(() => {
      setPendingTransactions((prev) => {
        prev.forEach((transaction) => {
          checkTransactionStatus(transaction);
        });
        return prev;
      });
    }, 10000); // Poll every 10 seconds
  }, [checkTransactionStatus]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const clearAllPending = useCallback(() => {
    setPendingTransactions([]);
    stopPolling();
  }, [stopPolling]);

  return {
    pendingTransactions,
    addPendingTransaction,
    removePendingTransaction,
    clearAllPending,
    isPolling: pollingIntervalRef.current !== null,
  };
};
