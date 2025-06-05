import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getMessages, updateMessage } from "@/apis/services/messages";
import { FilterMessageDto } from "@/apis/dto";
import { useDispatch, useSelector } from "react-redux";
import { openAlert } from "@/redux/slices/alert-slice";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { closeConfirm, openConfirm } from "@/redux/slices/confirm-slice";
import { Message } from "@/config/types";
import Button from "@/lib/button";
import { RootState } from "@/redux/store";
import { refetch } from "@/redux/slices/refetch-slice";

interface SavedPrompt {
  id: string;
  content: string;
  timestamp: Date;
}

const SavedPromptsModal = () => {
  const dispatch = useDispatch();
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const LIMIT = 10;
  // const count = useSelector((state: RootState) => state.refetch.count);

  // Track if initial fetch has been done
  const hasFetchedRef = useRef(false);

  const fetchSavedPrompts = async (pageNumber: number, isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) {
        dispatch(openLoading());
      } else {
        setIsLoadingMore(true);
      }

      const filterData: FilterMessageDto = {
        isSaved: true,
        page: pageNumber,
        limit: LIMIT,
      };

      const response = await getMessages(filterData);
      const prompts: SavedPrompt[] = response.data
        .filter((msg: Message) => msg.sender === "USER")
        .map((msg: Message) => ({
          id: msg.id.toString(),
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }));

      // Update hasMore based on meta data
      const { meta } = response;
      setHasMore(meta.page < meta.totalPages);

      if (isLoadMore) {
        setSavedPrompts((prev) => [...prev, ...prompts]);
      } else {
        setSavedPrompts(prompts);
      }
    } catch (error: any) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: error.message || "Failed to fetch saved prompts. Please try again.",
          type: "error",
        }),
      );
    } finally {
      if (!isLoadMore) {
        dispatch(closeLoading());
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    // Chỉ gọi nếu chưa fetch lần nào
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchSavedPrompts(1);
    }
  }, []); // Empty dependency array

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSavedPrompts(nextPage, true);
  };

  const handleDeletePrompt = async (promptId: string) => {
    const confirm = {
      isOpen: true,
      title: "Delete saved prompt",
      subtitle: "Are you sure you want to remove this prompt from saved list?",
      titleAction: "Delete",
      handleAction: async () => {
        try {
          dispatch(openLoading());
          await updateMessage({
            messageId: Number(promptId),
            isSaved: false,
          });
          dispatch(refetch());
          // Reset hasFetchedRef to allow refetch
          hasFetchedRef.current = false;
          // Fetch updated data
          await fetchSavedPrompts(1);
          dispatch(
            openAlert({
              isOpen: true,
              title: "SUCCESS",
              subtitle: "Prompt removed from saved list!",
              type: "success",
            }),
          );
        } catch (error: any) {
          dispatch(
            openAlert({
              isOpen: true,
              title: "ERROR",
              subtitle: error.message || "Failed to remove prompt. Please try again.",
              type: "error",
            }),
          );
        } finally {
          dispatch(closeLoading());
          dispatch(closeConfirm());
        }
      },
    };
    dispatch(openConfirm(confirm));
  };

  const handleCopyPrompt = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      dispatch(
        openAlert({
          isOpen: true,
          title: "SUCCESS",
          subtitle: "Prompt copied to clipboard!",
          type: "success",
        }),
      );
    } catch (error: any) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: "Failed to copy prompt. Please try again.",
          type: "error",
        }),
      );
    }
  };

  if (savedPrompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-grey-c500">
        <svg width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0 1)" fill="none" fillRule="evenodd">
            <ellipse fill="#f3f3f3" cx="32" cy="33" rx="32" ry="7"></ellipse>
            <g fillRule="nonzero" stroke="#d9d9d9">
              <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path>
              <path
                d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z"
                fill="#fafafa"
              ></path>
            </g>
          </g>
        </svg>
        <p className="mt-2">No saved prompts yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="py-2 px-4 flex flex-col gap-2">
        {savedPrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl"
          >
            <div className="flex items-start gap-2 flex-1">
              <Image src="/icons/prompt-icon.svg" alt="prompt-icon" width={20} height={20} className="mt-1" />
              <div className="flex flex-col gap-1">
                <div className="text-grey-c900 font-medium">{prompt.content}</div>
                <div className="text-grey-c500 text-xs">{prompt.timestamp.toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex flex-col gap-0">
              <button
                onClick={() => handleCopyPrompt(prompt.content)}
                className="p-1 hover:bg-primary-c200 rounded-lg transition-colors"
              >
                <Image
                  src="/icons/prompt-copy-icon.svg"
                  alt="copy"
                  width={20}
                  height={20}
                  className="opacity-60 hover:opacity-100"
                />
              </button>
              <button
                onClick={() => handleDeletePrompt(prompt.id)}
                className="p-1 hover:bg-primary-c200 rounded-lg transition-colors"
              >
                <Image
                  src="/icons/prompt-delete-icon.svg"
                  alt="delete"
                  width={19.5}
                  height={19.5}
                  className="opacity-60 hover:opacity-100"
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="px-4 pb-4 w-full flex justify-center">
          <Button
            label={isLoadingMore ? "Loading..." : "Load more"}
            status="primary"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-fit py-2.5 px-6 flex items-center justify-center gap-2"
          />
        </div>
      )}
    </div>
  );
};

export default SavedPromptsModal;
