// Test script for Hotels.com RapidAPI
// Run with: node test-hotelscom.js

import { getHotelsFromHotelsCom } from "./lib/hotelscom/rapidapi.js";

async function test() {
  console.log("Testing Hotels.com RapidAPI...");
  
  // Test with Madrid
  const hotels = await getHotelsFromHotelsCom({
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
  }
}

test().catch(console.error);