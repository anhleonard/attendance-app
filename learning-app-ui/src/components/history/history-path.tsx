import React from "react";

const classes = [
  {
    id: 1,
    title: "MMA Class",
    date: "21/02/2023 - Now",
    sessions: 123,
    active: true,
  },
  {
    id: 2,
    title: "LLM Class",
    date: "21/02/2023 - 21/02/2024",
    sessions: 123,
    active: false,
  },
  {
    id: 3,
    title: "NLP Class",
    date: "21/02/2023 - 21/02/2024",
    sessions: 123,
    active: false,
  },
  {
    id: 4,
    title: "HTN Class",
    date: "21/02/2023 - 21/02/2024",
    sessions: 123,
    active: false,
  },
];

const HistoryPath = () => {
  return (
    <div className="max-w-md mx-auto grid grid-cols-2 gap-8 pt-2 py-6">
      {classes.map((item) => (
        <div key={item.id} className="flex items-start space-x-4">
          {/* Số thứ tự */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
              item.active ? "bg-primary-c900" : "bg-grey-c200"
            }`}
          >
            {item.id}
          </div>

          {/* Nội dung */}
          <div className="border-l-[1px] border-gray-300 pl-4 pb-8 last:pb-0">
            <h3 className={`text-lg font-bold mb-2 ${item.active ? "text-primary-c900" : "text-grey-c400"}`}>
              {item.title}
            </h3>
            <p className={`text-xs mb-2 ${item.active ? "text-primary-c900" : "text-grey-c300"}`}>{item.date}</p>
            <p className={`text-xs ${item.active ? "text-primary-c900" : "text-grey-c300"}`}>Total sessions: {item.sessions}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryPath;
