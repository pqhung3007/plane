"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { CheckCircle2, AlertCircle, XCircle, MessageSquare, Smile, MoreVertical, Trash2 } from "lucide-react";
import { Menu, Disclosure } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
import type { IProjectUpdate, IProjectUpdateComment, TProjectUpdateStatus } from "@plane/types";
import { ProjectUpdateService } from "@/services/project";

type Props = {
  workspaceSlug: string;
  projectId: string;
  update: IProjectUpdate;
  hasEditPermission: boolean;
  onDelete: () => void;
};

const statusConfig: Record<
  TProjectUpdateStatus,
  { icon: any; color: string; bgColor: string; label: string }
> = {
  on_track: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    label: "🚀 On Track",
  },
  at_risk: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    label: "⚠️ At Risk",
  },
  off_track: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    label: "❗ Off Track",
  },
};

const commonEmojis = ["👍", "🎉", "❤️", "🚀", "👏", "🔥"];

export const UpdateCard = observer((props: Props) => {
  const { workspaceSlug, projectId, update, hasEditPermission, onDelete } = props;

  const [comments, setComments] = useState<IProjectUpdateComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [reactions, setReactions] = useState(update.reactions || []);

  const service = new ProjectUpdateService();

  useEffect(() => {
    setReactions(update.reactions || []);
  }, [update.reactions]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const fetchedComments = await service.getComments(workspaceSlug, projectId, update.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setIsPostingComment(true);
    try {
      const comment = await service.createComment(workspaceSlug, projectId, update.id, newComment);
      setComments([...comments, comment]);
      setNewComment("");
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Comment posted successfully",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to post comment",
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await service.deleteComment(workspaceSlug, projectId, update.id, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Comment deleted successfully",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to delete comment",
      });
    }
  };

  const handleAddReaction = async (emoji: string) => {
    try {
      await service.addReaction(workspaceSlug, projectId, update.id, emoji);
      // Optimistically update UI
      setReactions([...reactions, { id: Date.now().toString(), emoji, user_id: "current", created_at: new Date().toISOString() }]);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to add reaction",
      });
    }
  };

  const handleRemoveReaction = async (reactionId: string) => {
    try {
      await service.removeReaction(workspaceSlug, projectId, update.id, reactionId);
      setReactions(reactions.filter((r) => r.id !== reactionId));
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to remove reaction",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this update?")) return;

    try {
      await service.deleteProjectUpdate(workspaceSlug, projectId, update.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Update deleted successfully",
      });
      onDelete();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to delete update",
      });
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const StatusIcon = statusConfig[update.status].icon;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof reactions>);

  return (
    <div className="border border-custom-border-200 rounded-lg p-4 hover:bg-custom-background-90 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${statusConfig[update.status].bgColor} flex-shrink-0`}>
          <StatusIcon className={`h-5 w-5 ${statusConfig[update.status].color}`} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${statusConfig[update.status].bgColor} ${statusConfig[update.status].color}`}
              >
                {statusConfig[update.status].label}
              </span>
              <span className="text-xs text-custom-text-300">{formatRelativeTime(update.created_at)}</span>
            </div>
            {hasEditPermission && (
              <Menu as="div" className="relative">
                <Menu.Button className="p-1 hover:bg-custom-background-80 rounded">
                  <MoreVertical className="h-4 w-4 text-custom-text-300" />
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-1 w-40 bg-custom-background-100 border border-custom-border-200 rounded-md shadow-lg z-10">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDelete}
                        className={`${
                          active ? "bg-custom-background-90" : ""
                        } flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-custom-text-200 mb-3 whitespace-pre-wrap">{update.message}</p>

          {/* Reactions */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
              <button
                key={emoji}
                onClick={() => {
                  const userReaction = reactionList.find((r) => r.user_id === "current");
                  if (userReaction) {
                    handleRemoveReaction(userReaction.id);
                  } else {
                    handleAddReaction(emoji);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 bg-custom-background-90 hover:bg-custom-background-80 border border-custom-border-200 rounded-md text-xs transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-custom-text-300">{reactionList.length}</span>
              </button>
            ))}
            <Menu as="div" className="relative">
              <Menu.Button className="p-1 hover:bg-custom-background-80 rounded">
                <Smile className="h-4 w-4 text-custom-text-300" />
              </Menu.Button>
              <Menu.Items className="absolute left-0 mt-1 p-2 bg-custom-background-100 border border-custom-border-200 rounded-md shadow-lg z-10">
                <div className="flex gap-1">
                  {commonEmojis.map((emoji) => (
                    <Menu.Item key={emoji}>
                      {({ active }) => (
                        <button
                          onClick={() => handleAddReaction(emoji)}
                          className={`${
                            active ? "bg-custom-background-90" : ""
                          } p-2 rounded hover:bg-custom-background-90 text-lg`}
                        >
                          {emoji}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Menu>
          </div>

          {/* Comments Section */}
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button
                  onClick={() => {
                    if (!open && comments.length === 0) {
                      loadComments();
                    }
                  }}
                  className="flex items-center gap-2 text-xs text-custom-text-300 hover:text-custom-text-200 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>
                    {comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? "s" : ""}` : "Add comment"}
                  </span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                </Disclosure.Button>
                <Disclosure.Panel className="mt-3 space-y-3">
                  {isLoadingComments ? (
                    <p className="text-xs text-custom-text-400">Loading comments...</p>
                  ) : (
                    <>
                      {comments.map((comment) => (
                        <div key={comment.id} className="pl-4 border-l-2 border-custom-border-200">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-custom-text-200">{comment.comment}</p>
                            {hasEditPermission && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-custom-text-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-custom-text-400 mt-1">
                            {formatRelativeTime(comment.created_at)}
                          </p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handlePostComment();
                            }
                          }}
                          placeholder="Write a comment..."
                          className="flex-1 px-3 py-1.5 bg-custom-background-100 border border-custom-border-200 rounded-md text-sm text-custom-text-100 placeholder-custom-text-400 focus:outline-none focus:ring-1 focus:ring-custom-primary focus:border-transparent"
                        />
                        <Button variant="primary" size="sm" onClick={handlePostComment} loading={isPostingComment}>
                          Post
                        </Button>
                      </div>
                    </>
                  )}
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
      </div>
    </div>
  );
});
