import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

export const useBillingGroupInvitations = (shopId, billingGroupId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingGroupInvitations, setbillingGroupInvitations] = useState({});

  const fetchBillingGroupInvitations = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${billingGroupId}/invite`
      );
      const data = await r.json();
      if (data.invites) {
        setbillingGroupInvitations(data.invites);
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

  const createBillingGroupInvitation = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${billingGroupId}/invite`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const updatedbillingGroupInvitations = await r.json();
      if (updatedbillingGroupInvitations.invites) {
        setbillingGroupInvitations(updatedbillingGroupInvitations.invites);
        setOpLoading(false);
      } else {
        toast.error(updatedbillingGroupInvitations);
        setError(updatedbillingGroupInvitations);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingGroupInvitations();
  }, []);

  return {
    billingGroupInvitations,
    loading,
    error,
    refetch: fetchBillingGroupInvitations,
    createBillingGroupInvitation,
    opLoading,
  };
};
