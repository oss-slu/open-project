import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

export const useLedger = (shopId, userId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [balance, setBalance] = useState(0);

  const fetchLedger = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}/ledger`);
      const data = await r.json();
      if (data.ledgerItems) {
        setLedger(data.ledgerItems);
        setBalance(data.balance);
        setLoading(false);
      } else {
        setError(data);
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const postLedgerItem = async ({ type, value }) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}/ledger`, {
        method: "POST",
        body: JSON.stringify({
          type,
          value,
        }),
      });
      const data = await r.json();
      if (data.ledgerItems) {
        setLedger(data.ledgerItems);
        setBalance(data.balance);
        setOpLoading(false);
        return true;
      } else {
        toast.error(data);
        setError(data);
        setOpLoading(false);
        return false;
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
      return false;
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  return {
    ledger,
    loading,
    error,
    refetch: fetchLedger,
    postLedgerItem,
    opLoading,
    balance,
  };
};
