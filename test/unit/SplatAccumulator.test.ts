import * as THREE from "three";
import { expect, test, vi } from "vitest";
import { SplatAccumulator } from "../../src/SplatAccumulator";
import { SplatEdit } from "../../src/SplatEdit";
import { SplatGenerator } from "../../src/SplatGenerator";

test("registered generators receive timer deltas and edits, respecting visibility and layers", () => {
  const timer = new THREE.Timer();
  vi.spyOn(timer, "getElapsed").mockReturnValue(12);
  vi.spyOn(timer, "getDelta").mockReturnValue(0.025);
  const previous = new SplatAccumulator();
  previous.time = 9;
  const visible = new SplatGenerator({ update: vi.fn() });
  const hidden = new SplatGenerator({ update: vi.fn() });
  const excluded = new SplatGenerator({ update: vi.fn() });
  excluded.layers.set(1);
  const parent = new THREE.Group();
  parent.visible = false;
  parent.add(hidden);
  const edit = new SplatEdit();
  const next = new SplatAccumulator();
  const result = next.prepareGenerate({
    renderer: {} as THREE.WebGLRenderer,
    timer,
    camera: new THREE.PerspectiveCamera(),
    sortRadial: true,
    renderSize: new THREE.Vector2(256, 256),
    previous,
    generators: new Set([visible, hidden, excluded]).values(),
    globalEdits: new Set([edit]).values(),
  });
  expect(result.visibleGenerators).toEqual([visible]);
  for (const object of [visible, hidden]) {
    expect(object.frameUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        time: 12,
        deltaTime: 0.025,
        globalEdits: [edit],
      }),
    );
  }
  expect(excluded.frameUpdate).not.toHaveBeenCalled();
  timer.dispose();
});
