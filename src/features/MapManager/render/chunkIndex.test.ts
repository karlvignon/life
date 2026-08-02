import { describe, expect, it } from "vitest";
import { cellToChunk, getChunkCount } from "./chunkIndex";

describe("chunkIndex", () => {
  it("maps cells in the same chunk", () => {
    expect(cellToChunk(0, 0)).toEqual({ cx: 0, cy: 0 });
    expect(cellToChunk(31, 31)).toEqual({ cx: 0, cy: 0 });
  });

  it("maps cells in adjacent chunks", () => {
    expect(cellToChunk(32, 0)).toEqual({ cx: 1, cy: 0 });
  });

  it("computes chunk counts for partial grids", () => {
    expect(getChunkCount(33, 33)).toEqual({ chunkCols: 2, chunkRows: 2 });
  });
});
