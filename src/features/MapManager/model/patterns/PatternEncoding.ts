import type { CellOffset } from "../../../../core/types/grid";

export type PatternEncoding = string;

export interface ParsedPatternEncoding {
  readonly width: number;
  readonly height: number;
  readonly cells: ReadonlyArray<Readonly<CellOffset>>;
}

/**
 * Parse un motif au format `x=<largeur>;y=<hauteur>;cells=<bits>`.
 * Les bits sont lus ligne par ligne, de gauche à droite (`1` = vivant).
 */
export function parsePatternEncoding(
  encoding: PatternEncoding,
): ParsedPatternEncoding {
  const match = /^x=(\d+);y=(\d+);cells=(.*)$/.exec(encoding);
  if (!match) {
    throw new SyntaxError(
      "pattern must use the format x=<width>;y=<height>;cells=<bits>",
    );
  }

  const width = parseDimension(match[1]!, "x");
  const height = parseDimension(match[2]!, "y");
  const bits = match[3]!;

  if (!/^[01]*$/.test(bits)) {
    throw new SyntaxError("pattern cells must contain only 0 and 1");
  }

  const expectedLength = width * height;
  if (!Number.isSafeInteger(expectedLength)) {
    throw new RangeError("pattern dimensions are too large");
  }
  if (bits.length !== expectedLength) {
    throw new RangeError(
      `pattern cells must contain exactly ${expectedLength} bits for ${width}x${height}, got ${bits.length}`,
    );
  }

  const cells: Array<Readonly<CellOffset>> = [];
  for (let index = 0; index < bits.length; index += 1) {
    if (bits[index] === "1") {
      cells.push(
        Object.freeze({
          x: index % width,
          y: Math.floor(index / width),
        }),
      );
    }
  }

  if (cells.length === 0) {
    throw new RangeError("pattern must contain at least one living cell");
  }

  return Object.freeze({
    width,
    height,
    cells: Object.freeze(cells),
  });
}

function parseDimension(value: string, axis: "x" | "y"): number {
  const dimension = Number(value);
  if (!Number.isSafeInteger(dimension) || dimension <= 0) {
    throw new RangeError(`pattern ${axis} must be a positive safe integer`);
  }
  return dimension;
}
