import { closeDrawer } from "@/redux/slices/drawer-slice";
import { RootState } from "@/redux/store";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

export default function Drawer() {
  const dispatch = useDispatch();
  const drawerData = useSelector((state: RootState) => state.drawer);
  const { isOpen, title, content } = drawerData;

  // Add useEffect to control body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleCloseDrawer = () => {
    dispatch(closeDrawer());
  };

  return (
    <div className="relative overflow-hidden">
      {/* Overlay when drawer is open */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-50 z-10" : "opacity-0 -z-10"
        }`}
        onClick={handleCloseDrawer}
      />

      {/* Drawer component (now from right side) */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } z-20`}
      >
        <div className="p-4 flex flex-col gap-3 h-full overflow-y-auto w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-base text-success-c800 font-semibold">{title}</h2>
            <button
              className="hover:bg-grey-c50 p-1.5 rounded-full active:bg-grey-c100 transition-transform duration-300"
              onClick={handleCloseDrawer}
            >
              <Image src="/icons/close-icon.svg" alt="close-icon" width={20} height={20} />
            </button>
          </div>

          <div className="h-[0.5px] min-h-[0.5px] bg-grey-c100 opacity-80 w-full mx-auto"></div>

          <div className="bg-white flex-1 text-sm text-grey-c900">{content}</div>
        </div>
      </div>
    </div>
  );
}
