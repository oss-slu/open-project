import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

// Module-level variables for caching
let cachedPrinterTypes = null;
let fetchPromise = null;

export const use3dPrinterTypes = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [printerTypes, setPrinterTypes] = useState(cachedPrinterTypes || {});

  const fetchTypes = async (shouldUpdateLoading = true) => {
    if (cachedPrinterTypes) {
      // Use cached data
      setPrinterTypes(cachedPrinterTypes);
      setLoading(false);
      return;
    }

    if (fetchPromise) {
      // Wait for the ongoing fetch to complete
      try {
        await fetchPromise;
        setPrinterTypes(cachedPrinterTypes);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
      return;
    }

    // Start a new fetch
    fetchPromise = (async () => {
      try {
        shouldUpdateLoading && setLoading(true);
        const r = await authFetch(`/api/shop/${shopId}/3d-printer/type`);
        const data = await r.json();
        if (data.types) {
          cachedPrinterTypes = data.types;
          setPrinterTypes(data.types);
          setLoading(false);

          setTimeout(() => {
            cachedPrinterTypes = null;
          }, 30000);
        } else {
          setError(data.error);
          setLoading(false);
        }
      } catch (error) {
        setError(error);
        setLoading(false);
      } finally {
        fetchPromise = null; // Reset fetchPromise after completion
      }
    })();
    await fetchPromise;
  };

  const createType = async (type, description) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/3d-printer/type`, {
        method: "POST",
        body: JSON.stringify({ type, description }),
      });
      const data = await r.json();
      if (data.types) {
        cachedPrinterTypes = data.types; // Update cache
        setPrinterTypes(data.types);
        setOpLoading(false);
      } else {
        toast.error(data.error);
        setError(data.error);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const deleteType = async (typeId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this type? This is irreversible and will delete all associated materials."
      )
    ) {
      return;
    }
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/3d-printer/type/${typeId}`,
        {
          method: "DELETE",
        }
      );
      const data = await r.json();
      if (data.types) {
        cachedPrinterTypes = data.types; // Update cache
        setPrinterTypes(data.types);
        setOpLoading(false);
      } else {
        toast.error(data.error);
        setError(data.error);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  return {
    printerTypes,
    loading,
    error,
    refetch: fetchTypes,
    opLoading,
    createType,
    deleteType,
  };
};
