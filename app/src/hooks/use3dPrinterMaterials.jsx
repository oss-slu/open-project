import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

export const use3dPrinterMaterials = (shopId, typeId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [printerMaterials, setPrinterMaterials] = useState([]);

  const fetchMaterials = async (shouldUpdateLoading = true) => {
    try {
      shouldUpdateLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/3d-printer/material${
          typeId ? `?type=${typeId}` : ""
        }`
      );
      const data = await r.json();
      if (data.materials) {
        setPrinterMaterials(data.materials);
        setLoading(false);
      } else {
        setError(data.error);
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const createMaterial = async (
    type,
    description,
    manufacturer,
    printerTypeId
  ) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/3d-printer/material`, {
        method: "POST",
        body: JSON.stringify({
          type,
          description,
          manufacturer,
          printerTypeId,
        }),
      });
      const data = await r.json();
      if (data.materials) {
        setPrinterMaterials(data.materials);
        setOpLoading(false);
        return true;
      } else {
        toast.error(data.error);
        setError(data.error);
        setOpLoading(false);
        return false;
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
      return false;
    }
  };

  const deleteMaterial = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this material?")) {
      return;
    }
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/3d-printer/material/${materialId}`,
        {
          method: "DELETE",
        }
      );
      const data = await r.json();
      if (data.materials) {
        setPrinterMaterials(data.materials);
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
    fetchMaterials();
  }, [typeId]);

  return {
    printerMaterials,
    loading,
    error,
    refetch: fetchMaterials,
    opLoading,
    createMaterial,
    deleteMaterial,
  };
};
