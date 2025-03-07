import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

export const useComments = (shopId, jobId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);

  const fetchComments = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}/comments`);
      const data = await r.json();
      if (data.comments) {
        setComments(data.comments);
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

  const postComment = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}/comments`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const updatedComments = await r.json();
      if (updatedComments.comments) {
        setComments(updatedComments.comments);
        setOpLoading(false);
      } else {
        toast.error(updatedComments);
        setError(updatedComments);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    postComment,
    opLoading,
  };
};
