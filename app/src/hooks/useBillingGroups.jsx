import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

export const useBillingGroups = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingGroups, setBillingGroups] = useState([]);

  const fetchBillingGroups = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/groups`);
      const data = await r.json();
      if (data.groups) {
        setBillingGroups(data.groups);
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

  const createBillingGroup = async (data) => {
    console.log(data);
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/groups`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const updatedBillingGroups = await r.json();
      if (updatedBillingGroups.groups) {
        setBillingGroups(updatedBillingGroups.groups);
        setOpLoading(false);
      } else {
        toast.error(updatedBillingGroups);
        setError(updatedBillingGroups);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingGroups();
  }, []);

  return {
    billingGroups,
    loading,
    error,
    refetch: fetchBillingGroups,
    createBillingGroup,
    opLoading,
  };
};
