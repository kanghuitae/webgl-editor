import { describe, expect, it } from "vitest";
import { Emitter } from "../src/events";

type EventMap = {
  alpha: number;
  beta: string;
};

describe("Emitter", () => {
  it("subscribes and emits payloads", () => {
    const emitter = new Emitter<EventMap>();
    const calls: number[] = [];

    emitter.on("alpha", (value) => calls.push(value));
    emitter.emit("alpha", 7);
    emitter.emit("alpha", 11);

    expect(calls).toEqual([7, 11]);
  });

  it("unsubscribes listeners", () => {
    const emitter = new Emitter<EventMap>();
    const calls: string[] = [];

    const off = emitter.on("beta", (value) => calls.push(value));
    emitter.emit("beta", "a");
    off();
    emitter.emit("beta", "b");

    expect(calls).toEqual(["a"]);
  });
});
