import { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useShops = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState(null);
  const [opLoading, setOpLoading] = useState(false);

  const fetchShops = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch("/api/shop");
      const data = await r.json();
      setShops(data.shops);
      setMeta(data.meta);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const addUserToShop = async (userId, shopId, role) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}`, {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      const data = await r.json();
      if (data.error) {
        setError(data.error);
      }
      if (data.message === "success") {
        setOpLoading(false);
        fetchShops(false);
        return true;
      }
      setOpLoading(false);
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const removeUserFromShop = async (userId, shopId) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}`, {
        method: "DELETE",
      });
      const data = await r.json();
      if (data.error) {
        setError(data.error);
      }
      if (data.message === "success") {
        setOpLoading(false);
        fetchShops();
        return true;
      }
      setOpLoading(false);
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const changeUserRole = async (userId, shopId, role) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      const data = await r.json();
      if (data.error) {
        setError(data.error);
      }
      if (data.message === "success") {
        setOpLoading(false);
        fetchShops();
        return true;
      }
      setOpLoading(false);
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };


  const newShop = async (data) => {
    try { 
      const r = await authFetch(`/api/shop`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const createdShop = await r.json();
      if (createdShop.shop) {
        setShops(createdShop.shops);
      } else {
        toast.error(createdShop);
        setError(createdShop);
      }
    } catch (error) {
      setError(error);
    }
  };


  useEffect(() => {
    fetchShops();
  }, []);

  return {
    shops,
    loading,
    error,
    meta,
    refetch: fetchShops,
    addUserToShop,
    removeUserFromShop,
    changeUserRole,
    newShop,
    opLoading,
  };
};
