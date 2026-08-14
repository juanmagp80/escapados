import { searchFlightOptions } from "@/lib/serpapi/providers/flights";
import { searchFlightsTravelpayouts } from "@/lib/travelpayouts/travelpayouts";

describe("debug flights", () => {
  test("print options", async () => {
    const options = await searchFlightOptions({
      departureId: "AGP",
      arrivalId: "LHR",
      startDate: "2026-09-21",
      endDate: "2026-09-25",
      adults: 2,
      minNights: 2,
      maxNights: 5,
    });
    console.log("OPTIONS COUNT", options.length);
    for (const o of options.slice(0, 20)) {
      console.log(
        o.outbound,
        "->",
        o.returnDate,
        "total",
        o.totalPrice,
        "perP",
        o.pricePerPerson,
        "gate",
        o.source
      );
    }
    console.log("--- direct single search 25-27 ---");
    const single = await searchFlightsTravelpayouts({
      departureId: "AGP",
      arrivalId: "LHR",
      outboundDate: "2026-09-25",
      returnDate: "2026-09-27",
      adults: 2,
    });
    console.log(JSON.stringify(single, null, 2));
  });
});