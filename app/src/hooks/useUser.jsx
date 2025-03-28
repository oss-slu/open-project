import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import { useConfirm } from "tabler-react-2/dist/modal/confirm";

export const useUser = (userId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState([]);
  const [opLoading, setOpLoading] = useState(false);

  const { confirm: suspendConfirm, ConfirmModal: SuspendConfirmModal } =
    useConfirm({
      title: "Are you sure you want to suspend this user?",
      text: "Suspending this user will immediately block them from logging in. They will be redirected to a warning page informing them they have been suspended and showing the provided reason.",
      commitText: "Yes",
      cancelText: "No",
    });

  const { confirm: unSuspendConfirm, ConfirmModal: UnSuspendConfirmModal } =
    useConfirm({
      title: "Are you sure you want to unsuspend this user?",
      text: "Unuspending this user will immediately grant them full access to SLU Open Project. They will have access to all their prior content, events, logs, work, roles, and more.",
      commitText: "Yes",
      cancelText: "No",
    });

  const fetchUser = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/users/${userId}`);
      const data = await r.json();
      setUser(data.user);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const updateUserName = async (firstName, lastName, shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      await authFetch(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({
          userId,
          firstName,
          lastName,
        }),
      });
      console.log("User name updated.");
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const promoteUserToGlobalAdmin = async () => {
    setOpLoading(true);
    try {
      await authFetch(`/api/users/${userId}/admin`, {
        method: "POST",
      });
      await fetchUser(false);
    } catch (error) {
      setError(error);
    }
    setOpLoading(false);
  };

  const demoteUserFromGlobalAdmin = async () => {
    setOpLoading(true);
    try {
      await authFetch(`/api/users/${userId}/admin`, {
        method: "DELETE",
      });
      await fetchUser(false);
    } catch (error) {
      setError(error);
    }
    setOpLoading(false);
  };

  const suspendUser = async () => {
    setOpLoading(true);
    try {
      if (await suspendConfirm()) {
        const reason = prompt("Why are you suspending this user?");
        await authFetch(`/api/users/${userId}/suspension`, {
          method: "POST",
          body: JSON.stringify({ reason }),
        });
        await fetchUser(false);
      }
    } catch (error) {
      setError(error);
      console.error(error);
    }
    setOpLoading(false);
  };

  const unSuspendUser = async () => {
    setOpLoading(true);
    try {
      if (await unSuspendConfirm()) {
        await authFetch(`/api/users/${userId}/suspension`, {
          method: "DELETE",
        });
        await fetchUser(false);
      }
    } catch (error) {
      setError(error);
    }
    setOpLoading(false);
  };

  const updateSuspensionReason = async () => {
    setOpLoading(true);
    try {
      const reason = prompt("Why is this user suspended?");
      await authFetch(`/api/users/${userId}/suspension`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      });
      await fetchUser(false);
    } catch (error) {
      setError(error);
    }
    setOpLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    updateUserName,
    promoteUserToGlobalAdmin,
    opLoading,
    SuspendConfirmModal,
    UnSuspendConfirmModal,
    demoteUserFromGlobalAdmin,
    suspendUser,
    unSuspendUser,
    updateSuspensionReason,
  };
};
