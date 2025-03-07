import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

export const useMaterial = (shopId, resourceTypeId, materialId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [material, setMaterial] = useState({});

  const fetchMaterial = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/type/${resourceTypeId}/material/${materialId}`
      );
      const data = await r.json();
      if (data.material) {
        setMaterial(data.material);
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

  const updateMaterial = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/type/${resourceTypeId}/material/${materialId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const updatedMaterial = await r.json();
      if (updatedMaterial.material) {
        setMaterial(updatedMaterial.material);
        setOpLoading(false);
      } else {
        toast.error(updatedMaterial);
        setError(updatedMaterial);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const deleteMaterial = async () => {
    if (!confirm("Are you sure you want to delete this material?")) {
      return;
    }
    try {
      setOpLoading(true);
      await authFetch(
        `/api/shop/${shopId}/resources/type/${resourceTypeId}/material/${materialId}`,
        {
          method: "DELETE",
        }
      );
      setOpLoading(false);
      document.location.href = `/shops/${shopId}/resources`;
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const deleteMaterialImage = async (imageId) => {
    try {
      setOpLoading(true);
      await authFetch(
        `/api/shop/${shopId}/resources/type/${resourceTypeId}/material/${materialId}/images/${imageId}`,
        {
          method: "DELETE",
        }
      );
      setOpLoading(false);
      fetchMaterial(false);
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterial();
  }, [materialId, resourceTypeId]);

  return {
    material,
    loading,
    error,
    refetch: fetchMaterial,
    updateMaterial,
    opLoading,
    deleteMaterialImage,
    deleteMaterial,
  };
};
