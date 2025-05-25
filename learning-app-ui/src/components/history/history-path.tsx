import React from "react";
import moment from "moment";

interface ClassData {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  totalAttendances: number;
}

interface Props {
  currentClass: ClassData;
  pastClasses: ClassData[];
}

const HistoryPath: React.FC<Props> = ({ currentClass, pastClasses }) => {
  // Sort past classes by createdAt in descending order
  const sortedPastClasses = [...pastClasses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const allClasses = [currentClass, ...sortedPastClasses];

  return (
    <div className="max-w-md mx-auto grid grid-cols-2 gap-8 pt-2 py-6">
      {allClasses.map((item, index) => {
        const isCurrentClass = index === 0;
        const isLastItem = index === allClasses.length - 1;
        
        return (
          <div key={Math.random()} className="flex items-start space-x-4">
            {/* Số thứ tự */}
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                isCurrentClass ? "bg-primary-c900" : "bg-grey-c200"
              }`}
            >
              {index + 1}
            </div>

            {/* Nội dung */}
            <div className={`border-l-[1px] border-grey-c200 pl-4 ${!isLastItem ? "mb-4" : ""}`}>
              <h3 className={`text-lg font-bold mb-2 ${isCurrentClass ? "text-primary-c900" : "text-grey-c400"}`}>
                {item.name}
              </h3>
              <p className={`text-xs mb-2 ${isCurrentClass ? "text-primary-c900" : "text-grey-c300"}`}>
                {moment(item.createdAt).format("DD/MM/YYYY")} - {isCurrentClass ? "Now" : moment(item.updatedAt).format("DD/MM/YYYY")}
              </p>
              <p className={`text-xs ${isCurrentClass ? "text-primary-c900" : "text-grey-c300"}`}>
                Total sessions: {item.totalAttendances}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HistoryPath;
