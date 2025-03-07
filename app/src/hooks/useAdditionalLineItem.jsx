import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import { useConfirm } from "tabler-react-2/dist/modal/confirm";
import toast from "react-hot-toast";

export const useAdditionalLineItem = (
  shopId,
  jobId,
  lineItemId,
  jobFinalized
) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lineItem, setLineItem] = useState({});

  const { confirm, ConfirmModal } = useConfirm({
    title: "Already finalized",
    text: "This job has already been finalized. You can still update it, but you cannot re-charge the customer.",
    commitText: "Continue",
    cancelText: "Cancel",
  });

  const fetchLineItem = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems/${lineItemId}`
      );
      const data = await r.json();
      if (data.lineItem) {
        setLineItem(data.lineItem);
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

  const updateLineItem = async (data) => {
    if (jobFinalized) {
      const result = await confirm();
      if (!result) {
        return;
      }
    }
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems/${lineItemId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const updatedlineItem = await r.json();
      if (updatedlineItem.lineItem) {
        setLineItem(updatedlineItem.lineItem);
        setOpLoading(false);
        return true;
      } else {
        toast.error(updatedlineItem);
        setError(updatedlineItem);
        setOpLoading(false);
        fetchLineItem(false);
        return false;
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
      fetchLineItem(false);
      return false;
    }
  };

  const deleteLineItem = async (refetchLineItems) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems/${lineItemId}`,
        {
          method: "DELETE",
        }
      );
      const data = await r.json();
      if (data.success) {
        refetchLineItems && (await refetchLineItems(false));
        setLineItem(null);
        setOpLoading(false);
      } else {
        toast.error(data);
        setError(data);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchLineItem();
  }, []);

  return {
    lineItem,
    loading,
    error,
    refetch: fetchLineItem,
    updateLineItem,
    opLoading,
    deleteLineItem,
    ConfirmModal,
  };
};
