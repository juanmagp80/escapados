// Test script for Booking.com RapidAPI
// Run with: node test-bookingcom.js

import { getHotelsFromBookingCom } from "./lib/bookingcom/rapidapi.js";

async function test() {
  console.log("Testing Booking.com RapidAPI...");
  
  // Test with Madrid
  const hotels = await getHotelsFromBookingCom({
    q: "Madrid, Spain",
    checkIn: "2026-09-15",
    checkOut: "2026-09-17",
    guests: 2,
    maxPricePerNight: 200,
  });
  
  console.log(`Found ${hotels.length} hotels`);
  hotels.slice(0, 3).forEach((h, i) => {
    console.log(`${i + 1}. ${h.name} - €${h.pricePerNight}/night - Rating: ${h.rating} - ${h.link}`);
  });
  
  if (hotels.length === 0) {
    console.log("No hotels found. Check your API key and RapidAPI subscription.");
    console.log("Make sure you're subscribed to 'booking-com15' on RapidAPI");
  }
}

test().catch(console.error);