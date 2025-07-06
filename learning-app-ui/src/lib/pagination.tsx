import { useState, useEffect } from "react";
import Select from "./select";
import Image from "next/image";

const rowsPerPageOptions = [
  {
    label: "5",
    value: "5",
  },
  {
    label: "10",
    value: "10",
  },
  {
    label: "25",
    value: "25",
  },
  {
    label: "50",
    value: "50",
  },
];

interface Props {
  totalItems: number;
  //eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  onPageChange: Function;
  rowsEachPage?: number;
  nowPage?: number;
}

const Pagination = ({ totalItems = 20, onPageChange, rowsEachPage, nowPage }: Props) => {
  const [rowsPerPage, setRowsPerPage] = useState(rowsEachPage ?? parseInt(rowsPerPageOptions[0]?.value, 10));
  const [currentPage, setCurrentPage] = useState(nowPage ?? 1);

  // Sync internal state with props
  useEffect(() => {
    if (nowPage !== undefined) {
      setCurrentPage(nowPage);
    }
  }, [nowPage]);

  useEffect(() => {
    if (rowsEachPage !== undefined) {
      setRowsPerPage(rowsEachPage);
    }
  }, [rowsEachPage]);

  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(startIndex + rowsPerPage - 1, totalItems);

  const handleRowsPerPageChange = (value: string) => {
    const newRowsPerPage = Number(value);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
    onPageChange(1, newRowsPerPage);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      onPageChange(newPage, rowsPerPage);
    }
  };

  return (
    <div className="flex items-center space-x-8 justify-end">
      <Select
        hasLabel={false}
        onChange={handleRowsPerPageChange}
        options={rowsPerPageOptions}
        defaultValue={String(rowsPerPage)}
        className="!w-20"
        selectBoxClassName="!py-2 !rounded-2xl"
        position="top"
      ></Select>
      <div className="flex items-center gap-4">
        <button
          className="p-1 rounded-full disabled:opacity-30 hover:bg-primary-c50 active:bg-primary-c100 disabled:hover:bg-transparent disabled:active:bg-transparent"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Image src="/icons/left-icon.svg" alt="left-icon" width={26} height={26} />
        </button>
        <span className="text-grey-c700 font-semibold">
          {startIndex}-{endIndex} <span className="font-normal">of</span> {totalItems}
        </span>
        <button
          className="p-1 rounded-full disabled:opacity-30 hover:bg-primary-c50 active:bg-primary-c100 disabled:hover:bg-transparent disabled:active:bg-transparent"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Image src="/icons/right-icon.svg" alt="right-icon" width={26} height={26} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
