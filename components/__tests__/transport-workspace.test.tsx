// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TransportWorkspace } from "../transport/TransportWorkspace";

vi.mock("../transport/TransportMap",()=>({TransportMap:()=> <div data-testid="transport-map"/>}));
afterEach(cleanup);
const initialSelection={category:"shinkansen" as const,region:"japan",routeId:null};
function renderWorkspace(){const onChange=vi.fn();const onThemeChange=vi.fn();const onOpenLegacy=vi.fn();render(<TransportWorkspace initialSelection={initialSelection} onChange={onChange} onThemeChange={onThemeChange} onOpenLegacy={onOpenLegacy}/>);return {onChange,onThemeChange,onOpenLegacy};}
describe("transport exploration",()=>{
  test("searches public road names and exposes geometry and naming sources separately",async()=>{
    const user=userEvent.setup();const {onChange}=renderWorkspace();
    await user.click(screen.getByRole("button",{name:"高速道路"}));
    await user.type(screen.getByRole("searchbox"),"東名");
    await user.click(screen.getByRole("button",{name:/^東名高速道路/}));
    const detail=screen.getByRole("region",{name:"選んだ路線の詳細"});
    expect(within(detail).getByText("資料上の路線名：第一東海自動車道")).toBeTruthy();
    expect(within(detail).getAllByRole("link")).toHaveLength(2);
    expect(document.activeElement).toBe(within(detail).getByRole("heading"));
    expect(onChange.mock.lastCall?.[0]).toMatchObject({category:"expressway",routeId:"expressway-3e1a7729e381"});
    await user.click(within(detail).getByRole("button",{name:"閉じる"}));
    expect(screen.queryByRole("region",{name:"選んだ路線の詳細"})).toBeNull();
  });
  test("a discovery opens an evidenced freight/passenger ferry and resets search filters",async()=>{
    const user=userEvent.setup();const {onChange}=renderWorkspace();
    await user.type(screen.getByRole("searchbox"),"存在しない路線");
    expect(screen.getByRole("status")).toBeTruthy();
    await user.click(screen.getByRole("button",{name:/トラックも、船に乗る/}));
    const detail=screen.getByRole("region",{name:"選んだ路線の詳細"});
    expect(within(detail).getByRole("heading",{name:"大洗 — 苫小牧"})).toBeTruthy();
    expect(within(detail).getByText("人の移動")).toBeTruthy();
    expect(within(detail).getByText("物の輸送")).toBeTruthy();
    expect(within(detail).getByText(/実際の航行・飛行経路ではありません/)).toBeTruthy();
    expect(onChange.mock.lastCall?.[0]).toEqual({category:"sea",region:"japan",routeId:"sea-oarai-tomakomai"});
  });
  test("freight filter does not invent cargo coverage for passenger rail geometry",async()=>{
    const user=userEvent.setup();renderWorkspace();
    await user.selectOptions(screen.getByRole("combobox",{name:"運ぶ対象"}),"freight");
    expect(screen.getByRole("status").textContent).toContain("収録資料にありません");
    expect(screen.getByText(/貨物専用線は未収録/)).toBeTruthy();
  });
});
