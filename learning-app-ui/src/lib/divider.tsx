import { FC, memo } from "react";

const Divider: FC<React.HTMLAttributes<HTMLDivElement>> = function Divider(props) {
  return (
    <div
      className={`block h-[0.5px] w-full bg-transparent
  [background-image:repeating-linear-gradient(90deg,_#E2DFDF,_#E2DFDF_4px,_transparent_4px,_transparent_6px),_repeating-linear-gradient(180deg,_#E2DFDF,_#E2DFDF_4px,_transparent_4px,_transparent_6px),_repeating-linear-gradient(90deg,_#E2DFDF,_#E2DFDF_4px,_transparent_4px,_transparent_6px),_repeating-linear-gradient(180deg,_#E2DFDF,_#E2DFDF_4px,_transparent_4px,_transparent_6px)]
  [background-position:left_top,_right_top,_left_bottom,_left_top]
  [background-repeat:repeat-x,_repeat-y,_repeat-x,_repeat-y]
  [background-size:100%_1px,_1px_100%,_100%_1px,_1px_100%]`}
      {...props}
    ></div>
  );
};

export default memo(Divider);
