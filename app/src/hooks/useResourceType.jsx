import { useState } from "react";
import useSWR from "swr";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

const fetcher = (url) => authFetch(url).then((res) => res.json());

export const useResourceType = (shopId, resourceTypeId) => {
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resourceType, setResourceType] = useState({});
  const [resources, setResources] = useState([]);

  const {
    error: fetchError,
    isLoading,
    mutate,
  } = useSWR(`/api/shop/${shopId}/resources/type/${resourceTypeId}`, fetcher, {
    onSuccess: (data) => {
      if (data.resourceType && data.resources) {
        setResourceType(data.resourceType);
        setResources(data.resources);
      } else {
        setError(data);
      }
    },
    onError: (err) => {
      setError(err);
    },
  });

  const updateResourceType = async (updatedData) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/type/${resourceTypeId}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedData),
        }
      );
      const updatedDataResponse = await r.json();
      if (updatedDataResponse.resourceType && updatedDataResponse.resources) {
        setResourceType(updatedDataResponse.resourceType);
        setResources(updatedDataResponse.resources);
        mutate(); // Re-fetch data after the update
      } else {
        toast.error(updatedDataResponse);
        setError(updatedDataResponse);
      }
    } catch (err) {
      setError(err);
    } finally {
      setOpLoading(false);
    }
  };

  return {
    resourceType,
    resources,
    loading: isLoading,
    opLoading,
    error: fetchError || error,
    refetch: mutate,
    updateResourceType,
  };
};
