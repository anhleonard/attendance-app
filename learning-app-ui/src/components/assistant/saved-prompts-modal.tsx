import React, { useState } from "react";
import Image from "next/image";

interface SavedPrompt {
  id: string;
  content: string;
  timestamp: Date;
}

interface Props {
  onSelectPrompt: (prompt: SavedPrompt) => void;
}

const SavedPromptsModal = ({ onSelectPrompt }: Props) => {
  // Sample data - in real app this would come from an API or store
  const initialPrompts: SavedPrompt[] = [
    {
      id: "1",
      content: "Can you explain React Hooks in detail?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      id: "2",
      content: "What are the main differences between Next.js and React?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    },
    {
      id: "3",
      content: "What are some TypeScript best practices for React development?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    },
    {
      id: "4",
      content: "How to implement infinite scroll in Next.js?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
    },
    {
      id: "5",
      content: "Explain the concept of Server Components in Next.js 13",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120), // 5 days ago
    },
    {
      id: "6",
      content: "What are the best practices for handling forms in React?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 144), // 6 days ago
    },
    {
      id: "7",
      content: "How to implement authentication in Next.js using NextAuth.js?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 168), // 7 days ago
    },
    {
      id: "8",
      content: "What are the key differences between useState and useReducer?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 192), // 8 days ago
    },
  ];

  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(initialPrompts);

  const handleDeletePrompt = (promptId: string) => {
    setSavedPrompts((prompts) => prompts.filter((prompt) => prompt.id !== promptId));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="py-2 px-4 flex flex-col gap-2">
        {savedPrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl cursor-pointer hover:bg-primary-c100 transition-colors"
          >
            <div className="flex items-start gap-2 flex-1" onClick={() => onSelectPrompt(prompt)}>
              <Image src="/icons/prompt-icon.svg" alt="prompt-icon" width={20} height={20} className="mt-1" />
              <div className="flex flex-col gap-1">
                <div className="text-grey-c900 font-medium">{prompt.content}</div>
                <div className="text-grey-c500 text-xs">{prompt.timestamp.toLocaleDateString()}</div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePrompt(prompt.id);
              }}
              className="p-1 hover:bg-primary-c200 rounded-lg transition-colors"
            >
              <Image
                src="/icons/delete-icon.svg"
                alt="delete"
                width={20}
                height={20}
                className="opacity-60 hover:opacity-100"
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedPromptsModal;
