import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedResponse } from "@apollo/client/testing";
import { EquipmentDetailPage } from "./EquipmentDetailPage";
import { EQUIPMENT_DETAIL, RETIRE_EQUIPMENT } from "../graphql/operations";
import { dayWindow } from "../lib/time";
import { MANAGER_WORKSPACE, renderPage } from "../test/render";

const DATE = "2031-03-10";

const detailMock = (overrides: object = {}, reservations: object[] = []): MockedResponse => ({
  request: { query: EQUIPMENT_DETAIL, variables: { id: "7", ...dayWindow(DATE) } },
  result: {
    data: {
      equipmentItem: {
        __typename: "Equipment",
        id: "7",
        name: "Laser cutter",
        category: "Cutting",
        location: "Bay 1",
        description: "Cuts acrylic.",
        active: true,
        reservations,
        ...overrides,
      },
    },
  },
});

const booking = (id: string, isMine: boolean, name: string) => ({
  __typename: "Reservation",
  id,
  startsAt: "2031-03-10T09:00:00Z",
  endsAt: "2031-03-10T10:00:00Z",
  note: "Signs",
  isMine,
  member: { __typename: "Member", id: id, name },
});

const renderDetail = (mocks: MockedResponse[], workspace = undefined as typeof MANAGER_WORKSPACE | undefined) =>
  renderPage(<EquipmentDetailPage />, {
    mocks,
    route: `/app/equipment/7?date=${DATE}`,
    path: "/app/equipment/:id",
    ...(workspace ? { workspace } : {}),
  });

describe("EquipmentDetailPage", () => {
  it("shows details and the day's schedule, naming other members and 'You'", async () => {
    renderDetail([detailMock({}, [booking("1", true, "Test Member"), booking("2", false, "Cora Mbeki")])]);

    expect(await screen.findByRole("heading", { name: "Laser cutter" })).toBeInTheDocument();
    expect(screen.getByText("Cuts acrylic.")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Cora Mbeki")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Book a slot" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retire equipment" })).toBeNull();
  });

  it("says when nothing is booked", async () => {
    renderDetail([detailMock()]);
    expect(await screen.findByText("Nothing booked on this day.")).toBeInTheDocument();
  });

  it("replaces the form with a notice for retired equipment", async () => {
    renderDetail([detailMock({ active: false })]);
    expect(await screen.findByText(/has been retired/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Book a slot" })).toBeNull();
  });

  it("lets managers retire equipment after confirming", async () => {
    const user = userEvent.setup();
    const retire: MockedResponse = {
      request: { query: RETIRE_EQUIPMENT, variables: { id: "7" } },
      result: {
        data: {
          retireEquipment: {
            __typename: "RetireEquipmentPayload",
            equipment: { __typename: "Equipment", id: "7", active: false },
            errors: [],
          },
        },
      },
    };
    renderDetail([detailMock(), retire], MANAGER_WORKSPACE);

    await user.click(await screen.findByRole("button", { name: "Retire equipment" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));
    await user.click(screen.getByRole("button", { name: "Retire equipment" }));
    await user.click(screen.getByRole("button", { name: "Yes, retire it" }));

    expect(await screen.findByText(/has been retired/)).toBeInTheDocument();
  });

  it("explains a missing or foreign item", async () => {
    renderDetail([
      {
        request: { query: EQUIPMENT_DETAIL, variables: { id: "7", ...dayWindow(DATE) } },
        result: { errors: [{ message: "Not found", extensions: { code: "NOT_FOUND" } }] as never },
      },
    ]);
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't find that");
  });
});
