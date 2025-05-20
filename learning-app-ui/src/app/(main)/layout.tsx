import React from "react";
import Sidebar from "../sidebar";
import Header from "../header";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex h-0 text-sm">
        <Sidebar />
        <div className="bg-white flex-1 overflow-y-auto scrollbar text-grey-c900">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
