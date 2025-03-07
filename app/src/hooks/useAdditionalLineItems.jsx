import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

export const useAdditionalLineItems = (shopId, jobId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lineItems, setLineItems] = useState([]);

  const fetchlineItems = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems`
      );
      const data = await r.json();
      if (data.lineItems) {
        setLineItems(data.lineItems);
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

  const createLineItem = async () => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems`,
        {
          method: "POST",
        }
      );
      const newLineItem = await r.json();
      if (newLineItem.lineItems) {
        setLineItems(newLineItem.lineItems);
        setOpLoading(false);
      } else {
        toast.error(newLineItem);
        setError(newLineItem);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchlineItems();
  }, [shopId, jobId]);

  return {
    lineItems,
    loading,
    opLoading,
    error,
    createLineItem,
    refetch: fetchlineItems,
  };
};
