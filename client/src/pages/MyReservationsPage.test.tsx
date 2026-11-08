import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedResponse } from "@apollo/client/testing";
import { MyReservationsPage } from "./MyReservationsPage";
import { CANCEL_RESERVATION, MY_RESERVATIONS } from "../graphql/operations";
import { renderPage } from "../test/render";

const reservation = {
  __typename: "Reservation",
  id: "5",
  startsAt: "2031-03-10T09:00:00Z",
  endsAt: "2031-03-10T10:00:00Z",
  note: "Box joints",
  status: "CONFIRMED",
  canCancel: true,
  equipment: { __typename: "Equipment", id: "7", name: "Laser cutter" },
};

const listMock = (nodes: object[], includePast = false): MockedResponse => ({
  request: { query: MY_RESERVATIONS, variables: { includePast } },
  result: { data: { myReservations: { __typename: "ReservationConnection", nodes } } },
});

const cancelMock = (errors: object[]): MockedResponse => ({
  request: { query: CANCEL_RESERVATION, variables: { id: "5" } },
  result: {
    data: {
      cancelReservation: {
        __typename: "CancelReservationPayload",
        reservation: errors.length
          ? null
          : { __typename: "Reservation", id: "5", status: "CANCELLED", canCancel: false },
        errors,
      },
    },
  },
});

describe("MyReservationsPage", () => {
  it("lists reservations and cancels one", async () => {
    const user = userEvent.setup();
    renderPage(<MyReservationsPage />, { mocks: [listMock([reservation]), cancelMock([])] });

    const row = (await screen.findByRole("link", { name: "Laser cutter" })).closest("tr");
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLElement).getByRole("button", { name: /Cancel Laser cutter/ }));

    expect(await screen.findByText(/^Cancelled Laser cutter/)).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText("cancelled")).toBeInTheDocument();
  });

  it("shows the server's reason when cancelling fails", async () => {
    const user = userEvent.setup();
    renderPage(<MyReservationsPage />, {
      mocks: [
        listMock([reservation]),
        cancelMock([
          { __typename: "UserError", field: null, message: "Reservations that have ended cannot be cancelled" },
        ]),
      ],
    });

    await user.click(await screen.findByRole("button", { name: /Cancel Laser cutter/ }));

    expect(await screen.findByText("Reservations that have ended cannot be cancelled")).toBeInTheDocument();
  });

  it("shows an empty state that links to equipment", async () => {
    renderPage(<MyReservationsPage />, { mocks: [listMock([])] });

    expect(await screen.findByRole("heading", { name: "No reservations yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse equipment" })).toHaveAttribute("href", "/app/equipment");
  });

  it("can include past bookings", async () => {
    const user = userEvent.setup();
    renderPage(<MyReservationsPage />, {
      mocks: [listMock([]), listMock([{ ...reservation, canCancel: false }], true)],
    });
    await screen.findByText("No reservations yet");

    await user.click(screen.getByLabelText("Include past bookings"));

    expect(await screen.findByRole("link", { name: "Laser cutter" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel/ })).toBeNull();
  });
});
