import { bookingWindow, dayWindow, formatDuration, parseDateInput, timeSlots, toDateInputValue } from "./time";

describe("parseDateInput", () => {
  it("parses a calendar date as local midnight", () => {
    const date = parseDateInput("2031-03-10");
    expect(date?.getFullYear()).toBe(2031);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(10);
    expect(date?.getHours()).toBe(0);
  });

  it.each(["", "2031-3-10", "10/03/2031", "2031-02-30", "2031-13-01"])("rejects %j", (value) => {
    expect(parseDateInput(value)).toBeNull();
  });
});

describe("toDateInputValue", () => {
  it("round-trips with parseDateInput and zero-pads", () => {
    expect(toDateInputValue(new Date(2031, 0, 5))).toBe("2031-01-05");
    const parsed = parseDateInput("2031-01-05");
    expect(parsed && toDateInputValue(parsed)).toBe("2031-01-05");
  });
});

describe("dayWindow", () => {
  it("covers exactly one local day", () => {
    const window = dayWindow("2031-03-10");
    expect(window).not.toBeNull();
    const from = new Date(window?.from ?? "");
    const to = new Date(window?.to ?? "");
    expect(from.getDate()).toBe(10);
    expect(to.getDate()).toBe(11);
    expect(to.getHours()).toBe(0);
  });

  it("returns null for invalid input", () => {
    expect(dayWindow("nope")).toBeNull();
  });
});

describe("timeSlots", () => {
  it("lists 15-minute steps inclusive of both ends", () => {
    const slots = timeSlots(9, 10);
    expect(slots).toEqual(["09:00", "09:15", "09:30", "09:45", "10:00"]);
  });

  it("defaults to a 07:00–22:00 day", () => {
    const slots = timeSlots();
    expect(slots[0]).toBe("07:00");
    expect(slots.at(-1)).toBe("22:00");
    expect(slots).toHaveLength(61);
  });
});

describe("bookingWindow", () => {
  it("combines local date, time, and duration", () => {
    const window = bookingWindow("2031-03-10", "09:30", 90);
    expect(window).not.toBeNull();
    const start = new Date(window?.startsAt ?? "");
    const end = new Date(window?.endsAt ?? "");
    expect([start.getHours(), start.getMinutes()]).toEqual([9, 30]);
    expect(end.getTime() - start.getTime()).toBe(90 * 60_000);
  });

  it("rejects malformed dates or times", () => {
    expect(bookingWindow("2031-03-10", "9:30", 60)).toBeNull();
    expect(bookingWindow("someday", "09:30", 60)).toBeNull();
  });
});

describe("formatDuration", () => {
  it.each([
    [15, "15 min"],
    [60, "1 h"],
    [90, "1 h 30 min"],
    [240, "4 h"],
  ])("%i minutes reads as %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
