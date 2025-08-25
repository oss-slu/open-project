import React, { useState } from "react";
import { useComments } from "#useComments";
import { Card, Util, Input, Typography, Badge } from "tabler-react-2";
import { Loading } from "#loading";
import { Button } from "#button";
import { Avatar } from "#avatar";
import moment from "moment";
import { useAuth } from "#hooks";
const { H4 } = Typography;

export const Comments = ({ jobId, shopId }) => {
  const { comments, postComment, opLoading, loading } = useComments(
    shopId,
    jobId
  );

  const [newCommentMessage, setNewCommentMessage] = useState("");

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Util.Col gap={1} style={{ maxHeight: 600, overflowY: "auto" }}>
        <div>
          <Input
            value={newCommentMessage}
            onChange={setNewCommentMessage}
            label="Comment Text"
            placeholder="Enter your comment here. Comments are permanent and cannot be deleted."
          />
          <Button
            onClick={() => postComment({ message: newCommentMessage })}
            loading={opLoading}
          >
            Post Comment
          </Button>
        </div>
        <Util.Spacer size={2} />
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </Util.Col>
    </div>
  );
};

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

const Comment = ({ comment }) => {
  const { user } = useAuth();
  return (
    <Card
      title={
        <Util.Row
          align="center"
          justify="between"
          gap={1}
          style={{ width: "100%" }}
        >
          <Util.Row align="center" gap={1}>
            <Avatar size="xs" dicebear initials={comment.user.id} />
            <H4 style={{ marginBottom: 0 }}>
              {comment.user.firstName} {comment.user.lastName}
            </H4>
            {comment.user?.shops?.[0]?.accountType !== "CUSTOMER" && (
              <Badge color="primary" soft>
                {comment.user.shops?.[0]?.accountType
                  .toLowerCase()
                  .capitalize()}
              </Badge>
            )}
            {comment.userId === user.id && (
              <Badge color="green" soft>
                You
              </Badge>
            )}
          </Util.Row>
          <Util.Col>
            <span className={"text-secondary"}>
              {moment(comment.createdAt).fromNow()} (
              {moment(comment.createdAt).format("MM/DD/YY, h:mm a")})
            </span>
          </Util.Col>
        </Util.Row>
      }
      style={{
        borderTopLeftRadius: "unset",
      }}
    >
      {comment.message}
    </Card>
  );
};
