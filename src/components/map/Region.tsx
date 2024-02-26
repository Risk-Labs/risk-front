import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import TroopsMarker from './TroopMarker';
import { useGetTiles } from '@/hooks/useGetTiles';
import { usePhase } from '@/hooks/usePhase';
import { useTurn } from '@/hooks/useTurn';
import { Phase, useElementStore } from '@/utils/store';
import { colorPlayer } from '@/utils/colors';
import { colorTilePlayer, colorTilePlayerHighlight } from '@/utils/customColors';
import { getNeighbors } from '@/utils/map';

interface Point {
  x: number;
  y: number;
}

interface RegionProps {
  id: number;
  containerRef?: React.MutableRefObject<null>;
  onRegionClick: () => void;
}

const Region: React.FC<RegionProps> = ({ id, containerRef, onRegionClick }) => {
  const { phase } = usePhase();
  const { turn } = useTurn();
  const { current_source, current_target, army_count, highlighted_region } = useElementStore((state) => state);

  const [isHilighted, setIsHighlighted] = useState(false);
  const [hilightedColor, setHilightedColor] = useState('yellow');
  const { tiles } = useGetTiles();

  const tile = tiles[id - 1];
  const tileArmy = tile ? tile.army : 0;
  const [troups, setTroups] = useState(0);

  useEffect(() => {
    let newTroups = tileArmy;
    if (phase === Phase.DEPLOY) {
      if (id === current_source) {
        newTroups = tileArmy + army_count;
      }
    } else if (phase === Phase.ATTACK) {
      if (id === current_source && current_target !== null) {
        newTroups = tileArmy - army_count;
      }
    } else if (phase === Phase.FORTIFY) {
      if (id === current_target) {
        newTroups = tileArmy + army_count;
      } else if (id === current_source && current_target !== null) {
        newTroups = tileArmy - army_count;
      }
    }
    setTroups(newTroups);
  }, [army_count, tileArmy, current_source, current_target]);

  const color = tile ? colorPlayer[tile.owner + 1 || 0] : 'white';
  const colorTile = tile ? colorTilePlayer[tile.owner + 1 || 0] : 'white';
  const colorTileHighLight = tile ? colorTilePlayerHighlight[tile.owner + 1 || 0] : 'white';

  const [position, setPosition] = useState<{ x: number; y: number }>();

  const [pathData, setPathData] = useState('');
  const [colorContinent, setColorContinent] = useState('');
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const filePath = `/svgs/regions/${id}.svg`;
    fetch(filePath)
      .then((response) => response.text())
      .then((svg) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(svg, 'image/svg+xml');
        const path = xmlDoc.getElementsByTagName('path')[0];
        if (path) {
          setPathData(path.getAttribute('d') || '');
          setColorContinent(path.getAttribute('fill') || 'white');
        }
      })
      .catch((error) => console.error('Error fetching SVG:', error));
  }, [id]);

  function calculateCentroidFromPath(d: string): Point {
    const commands = d.split(/(?=[LHM])/);
    const points: Point[] = [];
    let lastY = 0; // Last Y coordinate for handling "H" commands

    let point;
    commands.forEach((command: any) => {
      const type = command[0];
      const args = command
        .slice(1)
        .trim()
        .split(/\s*,\s*|\s+/);
      switch (type) {
        case 'M':
        case 'L':
          point = { x: parseFloat(args[0]), y: parseFloat(args[1]) };
          points.push(point);
          lastY = point.y;
          break;
        case 'H':
          points.push({ x: parseFloat(args[0]), y: lastY });
          break;
      }
    });

    let cx = 0,
      cy = 0,
      a = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const xi = points[i].x,
        yi = points[i].y;
      const xi1 = points[i + 1].x,
        yi1 = points[i + 1].y;
      const cross = xi * yi1 - xi1 * yi;
      cx += (xi + xi1) * cross;
      cy += (yi + yi1) * cross;
      a += cross;
    }

    // Close the polygon if it's not already closed
    if (points[0].x !== points[points.length - 1].x || points[0].y !== points[points.length - 1].y) {
      const xi = points[points.length - 1].x,
        yi = points[points.length - 1].y;
      const xi1 = points[0].x,
        yi1 = points[0].y;
      const cross = xi * yi1 - xi1 * yi;
      cx += (xi + xi1) * cross;
      cy += (yi + yi1) * cross;
      a += cross;
    }

    a /= 2;
    cx /= 6 * a;
    cy /= 6 * a;

    return { x: cx, y: cy };
  }

  useEffect(() => {
    const path = pathRef.current;
    if (path && pathData) {
      const centroid = calculateCentroidFromPath(pathData);

      const svgElement = path.ownerSVGElement;
      if (svgElement) {
        const point = svgElement.createSVGPoint();
        point.x = centroid.x;
        point.y = centroid.y;
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
  }, [pathData]);

  useEffect(() => {
    if (phase === Phase.DEPLOY) {
      if (current_source === id) {
        setHilightedColor('black');
        setIsHighlighted(true);
      } else {
        setIsHighlighted(false);
      }
    } else if (phase === Phase.ATTACK || phase === Phase.FORTIFY) {
      if (current_source !== null) {
        //if (id === 2) console.log('current_source', current_source, id);
        if (current_target === null) {
          // if there is no target
          if (current_source !== id) {
            // if the current tile is not the source
            const neighbors = getNeighbors(current_source);
            if (neighbors.includes(id)) {
              // if the current tile is a neighbor of the source
              if ((phase === Phase.FORTIFY && tile.owner === turn) || (phase === Phase.ATTACK && tile.owner !== turn)) {
                setHilightedColor('black');
                setIsHighlighted(true);
              } else {
                setIsHighlighted(false);
              }
            } else setIsHighlighted(false);
          } else {
            // if the current tile is the source
            setHilightedColor('yellow');
            setIsHighlighted(true);
          }
        } else if (current_target !== null) {
          //if (id === 2) console.log('bbbbb');
          //if (id === 2) console.log('current_target', current_target);
          if (current_target === id) {
            // if the current tile is the target
            setHilightedColor('black');
            setIsHighlighted(true);
          } else if (current_source === id) {
            // if the current tile is the source
            setHilightedColor('yellow');
            setIsHighlighted(true);
          }
        } else {
          setIsHighlighted(false);
        }
      } else {
        setIsHighlighted(false);
      }
    }
  }, [current_source, phase, current_target, id]);

  const isLogHighlighted = highlighted_region === id;

  const determineFillColor = (
    isHighlighted: boolean,
    hilightedColor: string,
    isLogHighlighted: boolean,
    colorTileHighLight: string,
    colorTile: string
  ) => {
    if (isHighlighted) {
      return hilightedColor === 'black' ? colorTileHighLight : hilightedColor;
    } else if (isLogHighlighted) {
      return 'yellow';
    } else {
      return colorTile;
    }
  };

  return (
    <>
      {position &&
        troups !== undefined &&
        containerRef &&
        containerRef.current &&
        ReactDOM.createPortal(
          <TroopsMarker
            position={{ x: position.x, y: position.y }}
            handlePathClick={onRegionClick}
            troups={troups}
            color={color}
            tile={tile}
            containerRef={containerRef}
          />,

          containerRef.current // render the button directly in the body
        )}
      <path
        ref={pathRef}
        d={pathData}
        fill={determineFillColor(isHilighted, hilightedColor, isLogHighlighted, colorTileHighLight, colorTile)}
        fillOpacity={1.0}
        stroke="black"
        strokeWidth="2"
      />
    </>
  );
};

export default Region;
