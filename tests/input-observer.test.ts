import { afterEach, describe, expect, it, vi } from "vitest";
import { observeInput } from "../src/core/input-observer";

describe("observeInput", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("re-emits a stable input after SPA mutations so detached UI can be restored", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<textarea id="prompt"></textarea><main></main>';
    const input = document.querySelector<HTMLElement>("#prompt")!;
    const onChange = vi.fn();
    const stop = observeInput(() => input, onChange);

    expect(onChange).toHaveBeenCalledWith(input);
    document.querySelector("main")!.append(document.createElement("section"));
    await vi.advanceTimersByTimeAsync(250);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(input);
    stop();
  });
});
