import type { CellOffset } from "../core/types/grid";

/** Parse un motif RLE LifeWiki (o = vivant, b = mort). */
export function parseRle(rle: string): CellOffset[] {
  const rows = rle.split("$");
  const cells: CellOffset[] = [];

  rows.forEach((row, y) => {
    let x = 0;
    let i = 0;

    while (i < row.length) {
      let runLength = "";
      while (i < row.length && row[i] >= "0" && row[i] <= "9") {
        runLength += row[i++];
      }

      const count = runLength ? parseInt(runLength, 10) : 1;
      const char = row[i++];

      if (char === "o") {
        for (let k = 0; k < count; k++) {
          cells.push({ x: x + k, y });
        }
      }

      x += count;
    }
  });

  return cells;
}
