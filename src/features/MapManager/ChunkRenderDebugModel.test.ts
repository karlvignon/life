import { describe, expect, it } from "vitest";
import { ChunkRenderDebugModel } from "./ChunkRenderDebugModel";

describe("ChunkRenderDebugModel", () => {
  it("fades rendered chunks over the configured duration", () => {
    const model = new ChunkRenderDebugModel(100);

    model.flash([{ cx: 1, cy: 2 }]);
    model.update(25);

    expect(model.getMarkers()).toEqual([{ cx: 1, cy: 2, opacity: 0.75 }]);
  });

  it("removes a marker after its flash duration", () => {
    const model = new ChunkRenderDebugModel(100);

    model.flash([{ cx: 1, cy: 2 }]);
    model.update(100);

    expect(model.getMarkers()).toEqual([]);
  });

  it("restarts the flash when a chunk is rendered again", () => {
    const model = new ChunkRenderDebugModel(100);

    model.flash([{ cx: 1, cy: 2 }]);
    model.update(75);
    model.flash([{ cx: 1, cy: 2 }]);

    expect(model.getMarkers()).toEqual([{ cx: 1, cy: 2, opacity: 1 }]);
  });
});
