"use client";
import Image from "next/image";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import TextArea from "@/lib/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { Tooltip } from "react-tooltip";
import { openModal } from "@/redux/slices/modal-slice";
import SavedPromptsModal from "@/components/assistant/saved-prompts-modal";
import { closeModal } from "@/redux/slices/modal-slice";
import { ACCESS_TOKEN } from "@/config/constants";
import { openAlert } from "@/redux/slices/alert-slice";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openConfirm } from "@/redux/slices/confirm-slice";
import { ConfirmState } from "@/config/types";
import { getChats, updateChat } from "@/apis/services/chats";
import { FilterChatDto, FilterMessageDto, UpdateChatDto } from "@/apis/dto";
import { getMessages } from "@/apis/services/messages";

interface MessageResponse {
  data: Array<{
    id: number;
    content: string;
    sender: "USER" | "BOT";
    isSaved: boolean;
    createdAt: string;
    updatedAt: string;
    userId: number;
    chatId: number;
    user: {
      id: number;
      email: string;
      fullname: string;
      role: string;
      permissions: string[];
      createdAt: string;
      updatedAt: string;
      locked: boolean;
    };
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  isActive?: boolean;
}

interface GroupedChatHistory {
  label: string;
  chats: ChatHistory[];
}

interface WelcomeState {
  isWelcome: boolean;
  message: string;
}

interface ChatHistoryItemProps {
  chat: ChatHistory;
  onEdit?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
}

const ChatHistoryItem = ({ chat, onEdit, onDelete }: ChatHistoryItemProps) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveEdit = () => {
    if (editedTitle.trim() && editedTitle !== chat.title && onEdit) {
      onEdit(chat.id, editedTitle.trim());
    } else {
      setEditedTitle(chat.title); // Reset if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedTitle(chat.title);
    }
  };

  const handleDelete = () => {
    const confirm: ConfirmState = {
      isOpen: true,
      title: 'Delete chat',
      subtitle: "Are you sure you want to delete this chat? This action cannot be undone.",
      titleAction: "Delete",
      handleAction: () => {
        if (onDelete) {
          onDelete(chat.id);
        }
        dispatch(closeModal());
      },
    };
    dispatch(openConfirm(confirm));
  };

  return (
    <div
      className={`group p-3 cursor-pointer transition-colors relative ${
        chat.isActive ? "bg-primary-c100/80" : "hover:bg-grey-c50"
      }`}
    >
      <div className="flex flex-col">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-0 border-b border-primary-c300 px-0 py-0.5 text-[15px] focus:outline-none focus:ring-0 mb-1 font-medium"
            autoFocus
          />
        ) : (
          <div className="font-medium text-[15px] text-black/90 mb-1 truncate pr-16">{chat.title}</div>
        )}
        <div className="text-[12px] text-grey-c500">{chat.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
      {!isEditing && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="p-1 hover:bg-grey-c100 rounded transition-colors"
          >
            <Image src="/icons/edit-icon.svg" alt="edit" width={16} height={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1 hover:bg-grey-c100 rounded transition-colors"
          >
            <Image src="/icons/delete-icon.svg" alt="delete" width={16} height={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const getTimeGroup = (date: Date): string => {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return "Hôm nay";
  } else if (diffInHours < 48) {
    return "Hôm qua";
  } else if (diffInHours < 168) {
    // 7 days
    return "7 ngày trước";
  } else {
    return "30 ngày trước";
  }
};

const groupChatHistory = (chats: ChatHistory[]): GroupedChatHistory[] => {
  const groups: { [key: string]: ChatHistory[] } = {};

  chats.forEach((chat) => {
    const groupLabel = getTimeGroup(chat.timestamp);
    if (!groups[groupLabel]) {
      groups[groupLabel] = [];
    }
    groups[groupLabel].push(chat);
  });

  // Convert to array and sort by time (most recent first)
  return Object.entries(groups)
    .map(([label, chats]) => ({ label, chats }))
    .sort((a, b) => {
      const timeOrder = ["Hôm nay", "Hôm qua", "7 ngày trước", "30 ngày trước"];
      return timeOrder.indexOf(a.label) - timeOrder.indexOf(b.label);
    });
};

// Add new ChatMessages component
const ChatMessages = React.memo(({ 
  messages, 
  welcomeState, 
  isLoadingMessages 
}: { 
  messages: Message[], 
  welcomeState: WelcomeState,
  isLoadingMessages: boolean 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (welcomeState.isWelcome) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-[70%] rounded-lg p-8 bg-grey-c50 text-grey-c900 text-center text-lg font-medium shadow-sm animate-[zoom-out_0.5s_ease-out_forwards]">
          {welcomeState.message}
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin">
          <Image src="/icons/loading-icon.svg" alt="loading" width={24} height={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[70%] rounded-lg p-3 whitespace-pre-wrap font-questrial text-[15px] ${
              message.isUser ? "bg-primary-c900 text-white" : "bg-grey-c50 text-grey-c900"
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

const Assistant = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [welcomeState, setWelcomeState] = useState<WelcomeState>({
    isWelcome: true,
    message: "Chào mừng tới với AI Assistant",
  });
  const [updatedChatHistory, setUpdatedChatHistory] = useState<ChatHistory[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch chats only once when component mounts
  useEffect(() => {
    const fetchChats = async () => {
      try {
        dispatch(openLoading());
        const filterData: FilterChatDto = {
          page: 1,
          rowPerPage: 30,
        };
        
        const response = await getChats(filterData);
        const chatItems = response.items || response.data || [];
        const chats: ChatHistory[] = chatItems.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          timestamp: new Date(chat.createdAt),
          isActive: chat.id === currentChatId,
        }));

        setUpdatedChatHistory(chats);
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error.message || "Failed to fetch chats. Please try again.",
            type: "error",
          })
        );
      } finally {
        dispatch(closeLoading());
      }
    };

    fetchChats();
  }, [dispatch]);

  // Update active state when currentChatId changes
  useEffect(() => {
    setUpdatedChatHistory(prev => 
      prev.map(chat => ({
        ...chat,
        isActive: chat.id === currentChatId,
      }))
    );
  }, [currentChatId]);

  const handleEditChatTitle = async (chatId: string, newTitle: string) => {
    try {
      dispatch(openLoading());
      const updateData: UpdateChatDto = {
        chatId: Number(chatId), // Convert string to number since API expects number
        title: newTitle,
      };
      
      await updateChat(updateData);

      // Update local state after successful API call
      setUpdatedChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
    } catch (error: any) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: error.message || "Failed to update chat title. Please try again.",
          type: "error",
        })
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      dispatch(openLoading());
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`http://localhost:8000/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      // Update local state after successful API call
      setUpdatedChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      
      // If the deleted chat was active, redirect to the main assistant page
      if (chatId === currentChatId) {
        router.push('/assistant');
      }
    } catch (error: any) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: error.message || "Failed to delete chat. Please try again.",
          type: "error",
        })
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  const handleChatSelect = useCallback((chatId: string) => {
    // Batch state updates together
    React.startTransition(() => {
      setCurrentChatId(chatId);
      setMessages([]);
      setWelcomeState({ isWelcome: false, message: "" });
    });
  }, []);

  const handleNewChat = useCallback(() => {
    // Batch state updates together
    React.startTransition(() => {
      setCurrentChatId(null);
      setMessages([]);
      setWelcomeState({
        isWelcome: true,
        message: "Chào mừng tới với AI Assistant",
      });
    });
  }, []);

  const ChatHistoryGroup = ({ group }: { group: GroupedChatHistory }) => {
    return (
      <div className="border-b border-grey-c100">
        <div className="px-4 py-2 text-sm font-bold text-primary-c900 flex items-center gap-2">
          <Image src="/icons/calendar-icon.svg" alt="calendar" width={18} height={18} />
          {group.label}
        </div>
        <div className="divide-y divide-grey-c100">
          {group.chats.map((chat) => (
            <div key={chat.id} onClick={() => handleChatSelect(chat.id)}>
              <ChatHistoryItem 
                chat={chat} 
                onEdit={handleEditChatTitle}
                onDelete={handleDeleteChat}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when chatId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChatId) {
        setMessages([]);
        setWelcomeState({
          isWelcome: true,
          message: "Chào mừng tới với AI Assistant",
        });
        return;
      }

      try {
        setIsLoadingMessages(true);
        const filterData: FilterMessageDto = {
          chatId: Number(currentChatId),
          page: 1,
          limit: 10
        };

        const response = await getMessages(filterData);
        const messageResponse = response as MessageResponse;

        const messages: Message[] = messageResponse.data.map((msg) => ({
          id: msg.id.toString(),
          content: msg.content,
          isUser: msg.sender === "USER",
          timestamp: new Date(msg.createdAt),
        }));

        setMessages(messages);
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error.message || "Failed to fetch messages. Please try again.",
            type: "error",
          })
        );
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [currentChatId, dispatch]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Clear welcome state when user sends first message
    if (welcomeState.isWelcome) {
      setWelcomeState({ isWelcome: false, message: "" });
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");

    try {
      dispatch(openLoading());
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        throw new Error("No authentication token found");
      }

      const payload: any = {
        message: messageToSend,
      };

      // Add chatId to payload if we're in an existing chat
      if (currentChatId) {
        payload.chat_id = Number(currentChatId);
      }

      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.response || "Sorry, I couldn't process your request.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If this was a new chat and we got a chatId back, update the currentChatId
      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId.toString());
      }
    } catch (error: any) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: error.message || "Failed to send message. Please try again.",
          type: "error",
        }),
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  const handleOpenSavedPrompts = () => {
    const modal = {
      isOpen: true,
      title: "Saved Prompts",
      content: <SavedPromptsModal onSelectPrompt={handleSelectPrompt} />,
      className: "max-w-2xl",
    };
    dispatch(openModal(modal));
  };

  const handleSelectPrompt = (prompt: { content: string }) => {
    setInputMessage(prompt.content);
    // Close the modal after selection
    dispatch(closeModal());
  };

  return (
    <div className="flex flex-row h-full">
      <div className="flex-1 flex flex-col h-full">
        <div className="flex flex-row items-center justify-between p-5 border-b border-grey-c100">
          <div className="flex items-center gap-2">
            <Image src="/icons/vertical-divide.svg" alt="vertical-divide" width={2} height={20} />
            <div className="text-xl font-bold">Assistant</div>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 px-2 py-1.5 text-sm font-semibold text-primary-c900 bg-primary-c100 hover:bg-primary-c200 active:bg-primary-c300 rounded-md transition-colors"
          >
            <Image src="/icons/blue-add-icon.svg" alt="new-chat" width={18} height={18} />
            New
          </button>
        </div>

        <ChatMessages 
          messages={messages}
          welcomeState={welcomeState}
          isLoadingMessages={isLoadingMessages}
        />

        {/* Input area */}
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center gap-2">
            <TextArea
              value={inputMessage}
              onChange={(value) => setInputMessage(value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1"
              rows={2}
              inputClassName="resize-none min-h-[44px] max-h-[120px] text-[15px]"
            />
            <button
              onClick={handleSendMessage}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-c900 text-white hover:bg-primary-c800 transition-colors"
            >
              <Image src="/icons/send-icon.svg" alt="send-icon" width={18} height={18} />
            </button>
          </div>
        </div>
      </div>
      <div className="w-[260px] h-full bg-white border-l border-grey-c100 overflow-y-auto">
        <div className="p-4 border-b border-grey-c100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/icons/history-chat-icon.svg" alt="history-chat-icon" width={22} height={22} />
              <h2 className="text-sm font-bold text-grey-c900">Chat history</h2>
            </div>
            <button
              onClick={handleOpenSavedPrompts}
              data-tooltip-id={`album-icon`}
              data-tooltip-content="Saved prompts"
            >
              <Image src="/icons/album-icon.svg" alt="album-icon" width={20} height={20} />
            </button>
            <Tooltip id={`album-icon`} />
          </div>
        </div>
        <div>
          {groupChatHistory(updatedChatHistory).map((group) => (
            <ChatHistoryGroup key={group.label} group={group} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Assistant;
