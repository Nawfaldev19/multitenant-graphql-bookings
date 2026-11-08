import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedResponse } from "@apollo/client/testing";
import { BookingForm } from "./BookingForm";
import { CREATE_RESERVATION } from "../../graphql/operations";
import { bookingWindow } from "../../lib/time";
import { renderPage } from "../../test/render";

const DATE = "2031-03-10";

function createMock(startTime: string, minutes: number, result: object, note = ""): MockedResponse {
  const window = bookingWindow(DATE, startTime, minutes);
  return {
    request: { query: CREATE_RESERVATION, variables: { equipmentId: "7", ...window, note } },
    result: { data: { createReservation: { __typename: "CreateReservationPayload", ...result } } },
  };
}

function renderForm(mocks: MockedResponse[], onBooked = vi.fn()) {
  renderPage(<BookingForm equipmentId="7" date={DATE} onDateChange={vi.fn()} onBooked={onBooked} />, { mocks });
  return onBooked;
}

describe("BookingForm", () => {
  it("sends the chosen local slot and confirms the booking", async () => {
    const user = userEvent.setup();
    const window = bookingWindow(DATE, "10:30", 90);
    const onBooked = renderForm([
      createMock(
        "10:30",
        90,
        {
          reservation: { __typename: "Reservation", id: "1", startsAt: window?.startsAt, endsAt: window?.endsAt },
          errors: [],
        },
        "Lamp shades",
      ),
    ]);

    await user.selectOptions(screen.getByLabelText("Start"), "10:30");
    await user.selectOptions(screen.getByLabelText("Duration"), "90");
    await user.type(screen.getByLabelText("Note (optional)"), "Lamp shades");
    await user.click(screen.getByRole("button", { name: "Book" }));

    expect(await screen.findByText(/^Booked /)).toBeInTheDocument();
    expect(onBooked).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Note (optional)")).toHaveValue("");
  });

  it("shows a server conflict next to the time fields and marks them invalid", async () => {
    const user = userEvent.setup();
    const onBooked = renderForm([
      createMock("09:00", 60, {
        reservation: null,
        errors: [{ __typename: "UserError", field: "startsAt", message: "This time overlaps an existing reservation" }],
      }),
    ]);

    await user.click(screen.getByRole("button", { name: "Book" }));

    expect(await screen.findByText("This time overlaps an existing reservation")).toBeInTheDocument();
    expect(screen.getByLabelText("Start")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Start")).toHaveAccessibleDescription("This time overlaps an existing reservation");
    expect(onBooked).not.toHaveBeenCalled();
  });

  it("shows whole-form errors and network failures as alerts", async () => {
    const user = userEvent.setup();
    const window = bookingWindow(DATE, "09:00", 60);
    renderForm([
      {
        request: { query: CREATE_RESERVATION, variables: { equipmentId: "7", ...window, note: "" } },
        error: new Error("offline"),
      },
    ]);

    await user.click(screen.getByRole("button", { name: "Book" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach the server");
  });

  it("disables the submit button while booking", async () => {
    const user = userEvent.setup();
    renderForm([{ ...createMock("09:00", 60, { reservation: null, errors: [] }), delay: 50 }]);

    await user.click(screen.getByRole("button", { name: "Book" }));

    expect(screen.getByRole("button", { name: "Booking…" })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Book" })).toBeEnabled());
  });
});
