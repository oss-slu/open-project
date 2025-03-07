import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const useBillingGroupInvitation = (
  shopId,
  groupId,
  billingGroupInvitationId
) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingGroupInvitation, setBillingGroupInvitation] = useState({});

  const navigate = useNavigate();

  const fetchBillingGroupInvitation = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${groupId}/invite/${billingGroupInvitationId}`
      );
      const data = await r.json();
      if (data.invite) {
        setBillingGroupInvitation(data.invite);
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

  const updateBillingGroupInvitation = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${groupId}/invite/${billingGroupInvitationId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const updatedBillingGroupInvitation = await r.json();
      if (updatedBillingGroupInvitation.invite) {
        setBillingGroupInvitation(updatedBillingGroupInvitation.invite);
        setOpLoading(false);
      } else {
        toast.error(updatedBillingGroupInvitation);
        setError(updatedBillingGroupInvitation);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const acceptBillingGroupInvitation = async () => {
    console.log("acceptBillingGroupInvitation");
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${groupId}/invite/${billingGroupInvitationId}`,
        {
          method: "POST",
        }
      );
      const updatedBillingGroupInvitation = (await r.json()).group;
      console.log(updatedBillingGroupInvitation);
      if (updatedBillingGroupInvitation.id) {
        // setBillingGroupInvitation(updatedBillingGroupInvitation.invite);
        navigate(`/shops/${shopId}/groups/${groupId}/portal`);
        setOpLoading(false);
      } else {
        toast.error(updatedBillingGroupInvitation);
        setError(updatedBillingGroupInvitation);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingGroupInvitation();
  }, []);

  return {
    billingGroupInvitation,
    loading,
    error,
    refetch: fetchBillingGroupInvitation,
    updateBillingGroupInvitation,
    acceptBillingGroupInvitation,
    opLoading,
  };
};
