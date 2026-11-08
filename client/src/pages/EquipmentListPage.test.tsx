import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedResponse } from "@apollo/client/testing";
import { EquipmentListPage } from "./EquipmentListPage";
import { EQUIPMENT_LIST } from "../graphql/operations";
import { renderPage } from "../test/render";

function listMock(
  variables: { search: string | null; category: string | null },
  names: string[],
  hasNextPage = false,
): MockedResponse {
  return {
    request: { query: EQUIPMENT_LIST, variables },
    result: {
      data: {
        equipment: {
          __typename: "EquipmentConnection",
          nodes: names.map((name, index) => ({
            __typename: "Equipment",
            id: String(index + 1),
            name,
            category: "Cutting",
            location: "Bay 1",
          })),
          pageInfo: { __typename: "PageInfo", hasNextPage, endCursor: "cursor-1" },
        },
        equipmentCategories: ["Cutting", "Woodworking"],
      },
    },
  };
}

describe("EquipmentListPage", () => {
  it("shows a loading state, then equipment linked to detail pages", async () => {
    renderPage(<EquipmentListPage />, {
      mocks: [listMock({ search: null, category: null }, ["Laser cutter", "Lathe"])],
    });

    expect(screen.getByText("Loading equipment")).toBeInTheDocument();
    const link = await screen.findByRole("link", { name: /Laser cutter/ });
    expect(link).toHaveAttribute("href", "/app/equipment/1");
    expect(screen.getByRole("heading", { name: "Equipment" })).toBeInTheDocument();
    expect(screen.getByText(/Everything you can book at Test Space/)).toBeInTheDocument();
  });

  it("debounces the search before querying", async () => {
    const user = userEvent.setup();
    renderPage(<EquipmentListPage />, {
      mocks: [
        listMock({ search: null, category: null }, ["Laser cutter", "Lathe"]),
        listMock({ search: "lathe", category: null }, ["Lathe"]),
      ],
    });
    await screen.findByRole("link", { name: /Laser cutter/ });

    await user.type(screen.getByLabelText("Search"), "lathe");

    expect(await screen.findByRole("link", { name: /Lathe/ })).toBeInTheDocument();
    expect(await screen.findByText("1 items shown")).toBeInTheDocument();
  });

  it("filters by category from the URL", async () => {
    renderPage(<EquipmentListPage />, {
      route: "/?category=Woodworking",
      mocks: [listMock({ search: null, category: "Woodworking" }, ["Lathe"])],
    });

    expect(await screen.findByRole("link", { name: /Lathe/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toHaveValue("Woodworking");
  });

  it("offers to clear filters when nothing matches", async () => {
    const user = userEvent.setup();
    renderPage(<EquipmentListPage />, {
      route: "/?category=Cutting",
      mocks: [
        listMock({ search: null, category: "Cutting" }, []),
        listMock({ search: null, category: null }, ["Lathe"]),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "Clear filters" }));

    expect(await screen.findByRole("link", { name: /Lathe/ })).toBeInTheDocument();
  });

  it("shows an error with a retry", async () => {
    renderPage(<EquipmentListPage />, {
      mocks: [
        { request: { query: EQUIPMENT_LIST, variables: { search: null, category: null } }, error: new Error("down") },
      ],
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("That didn't load");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows a load more button when there is another page", async () => {
    renderPage(<EquipmentListPage />, { mocks: [listMock({ search: null, category: null }, ["Laser cutter"], true)] });

    expect(await screen.findByRole("button", { name: "Load more" })).toBeEnabled();
  });
});
