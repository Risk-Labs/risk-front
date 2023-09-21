import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface RegionProps {
  d: string;
  fill: string;
  fillOpacity: number;
  region: string;
  troups?: number;
  containerRef?: React.MutableRefObject<null>;
}

const Region: React.FC<RegionProps> = ({
  d,
  fill,
  fillOpacity,
  region,
  troups,
  containerRef,
}: RegionProps) => {
  const [position, setPosition] = useState<{ x: number; y: number }>();
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (path) {
      const bbox = path.getBBox();
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;

      const svgElement = path.ownerSVGElement;
      if (svgElement) {
        const point = svgElement.createSVGPoint();
        point.x = cx;
        point.y = cy;
        const ctm = svgElement.getScreenCTM();
        if (!ctm) return;

        const screenPoint = point.matrixTransform(ctm);

        // Adjust for the SVG's position in the viewport
        const svgRect = svgElement.getBoundingClientRect();
        const x = screenPoint.x - svgRect.left;
        const y = screenPoint.y - svgRect.top;

        setPosition({ x, y });
      }
    }
  }, [region]);

  const handlePathClick = () => {
    console.log(`Clicked on region ${region}`);
    console.log(`Troups: ${troups}`);
  };

  return (
    <>
      {position &&
        containerRef &&
        containerRef.current &&
        ReactDOM.createPortal(
          <div
            className="absolute flex justify-center items-center cursor-pointer bg-red-500 border-2 border-red-700 rounded-full w-8 h-8"
            style={{
              top: `calc(${position.y}px - 15px)`,
              left: `calc(${position.x}px - 15px)`,
            }}
            onClick={() => handlePathClick()}
          >
            <span className="text-lg text-black">{troups}</span>
          </div>,

          containerRef.current // render the button directly in the body
        )}
      <path
        ref={pathRef}
        d={d}
        fill={fill}
        fillOpacity={fillOpacity}
        onClick={handlePathClick}
      ></path>
    </>
  );
};

export default Region;
