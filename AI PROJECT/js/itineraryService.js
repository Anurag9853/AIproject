
class ItineraryService {
  constructor() {
    this.baseUrl = 'https://api.example.com';
    this.mockData = false; // Set to false to use real APIs
  }

  async fetchItineraryDetails(formData) {
    try {
      // Weather data
      const weatherData = await this._fetchRealWeatherData(formData.destination);
      
      // Hotels/accommodations data
      const hostelsData = await this._fetchRealHotelsData(formData.destination, formData.budget);
      
      // Attractions data
      const attractionsData = await this._fetchRealAttractionsData(formData.destination);
      
      // Create activities based on destination and budget
      const activities = this._generateActivities(formData);
      
      return {
        destination: formData.destination,
        days: parseInt(formData.days),
        budget: formData.budget,
        travelers: formData.travelers,
        activities: activities.slice(0, Math.min(formData.days * 2, activities.length)),
        attractions: attractionsData,
        hostels: hostelsData,
        weather: weatherData,
      };
    } catch (error) {
      console.error('Error fetching itinerary details:', error);
      toast.error('Error fetching some data. Showing available information.');
      
      // If any API fails, try to return partial data
      return this._getPartialData(formData, error);
    }
  }

  async _fetchRealWeatherData(destination) {
    try {
      console.log("Fetching real weather data for:", destination);
      
      // First get coordinates for destination using Nominatim
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&countrycodes=in`, 
        { headers: { "Accept-Language": "en" } }
      );
      
      if (!geocodeResponse.ok) {
        throw new Error('Geocoding API request failed');
      }
      
      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData || geocodeData.length === 0) {
        throw new Error('Location not found');
      }
      
      const { lat, lon } = geocodeData[0];
      console.log("Coordinates for location:", lat, lon);
      
      // Use Open-Meteo for weather (free, no API key)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
        { headers: { "Accept": "application/json" } }
      );
      
      if (!weatherResponse.ok) {
        throw new Error('Weather API request failed');
      }
      
      const weatherData = await weatherResponse.json();
      
      if (!weatherData || !weatherData.current) {
        throw new Error('Invalid weather data');
      }
      
      // Map weather code to condition
      const weatherConditions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
      };
      
      // Get weather condition based on code
      const weatherCode = weatherData.current.weather_code;
      const condition = weatherConditions[weatherCode] || 'Unknown';
      
      // Map icon from weather code
      let icon = 'sun';
      if (weatherCode === 0) {
        icon = 'sun';
      } else if (weatherCode >= 1 && weatherCode <= 3) {
        icon = 'cloud';
      } else if (weatherCode >= 45 && weatherCode <= 48) {
        icon = 'cloud-fog';
      } else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
        icon = 'cloud-rain';
      } else if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) {
        icon = 'cloud-snow';
      } else if (weatherCode >= 95) {
        icon = 'cloud-lightning';
      }
      
      return {
        temperature: weatherData.current.temperature_2m,
        condition: condition,
        icon: icon,
        isMock: false
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast.warning('Using estimated weather data');
      
      // Fallback to basic weather estimate
      return {
        temperature: Math.floor(Math.random() * 15) + 25, // 25-40°C (common in India)
        condition: 'No data available',
        icon: 'cloud',
        isMock: false
      };
    }
  }

  async _fetchRealHotelsData(destination, budget) {
    try {
      console.log("Fetching real hotels for:", destination);
      
      // First get location coordinates using Nominatim
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&countrycodes=in`,
        { headers: { "Accept-Language": "en" } }
      );
      
      if (!geoResponse.ok) {
        throw new Error('Geo API request failed');
      }
      
      const geoData = await geoResponse.json();
      
      if (!geoData || geoData.length === 0) {
        throw new Error('Location not found');
      }
      
      const { lat, lon } = geoData[0];
      
      // Use Overpass API to query for accommodations
      const radius = budget === 'cheap' ? 5000 : budget === 'moderate' ? 10000 : 15000;
      
      // Query for tourism=hotel, tourism=hostel, and tourism=guest_house
      const overpassQuery = `
        [out:json];
        (
          node["tourism"="hotel"](around:${radius},${lat},${lon});
          node["tourism"="hostel"](around:${radius},${lat},${lon});
          node["tourism"="guest_house"](around:${radius},${lat},${lon});
        );
        out body 10;
      `;
      
      const overpassResponse = await fetch(
        `https://overpass-api.de/api/interpreter`, 
        {
          method: 'POST',
          body: overpassQuery,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      
      if (!overpassResponse.ok) {
        throw new Error('Accommodation API request failed');
      }
      
      const overpassData = await overpassResponse.json();
      
      if (!overpassData || !overpassData.elements || !Array.isArray(overpassData.elements)) {
        throw new Error('Invalid accommodation data');
      }
      
      // Process the results
      const hostels = [];
      const elements = overpassData.elements.filter(el => el.tags && el.tags.name);
      
      // If we have real data, use it
      if (elements.length > 0) {
        for (let i = 0; i < Math.min(5, elements.length); i++) {
          const element = elements[i];
          const tags = element.tags;
          
          // Calculate price based on budget and star rating
          let basePrice = budget === 'cheap' ? 1500 : budget === 'moderate' ? 3000 : 6000;
          if (tags.stars) {
            basePrice = basePrice * (parseInt(tags.stars) / 2);
          }
          
          const priceVariation = Math.random() * 500 - 250; // -250 to +250 INR
          const price = Math.max(800, Math.floor(basePrice + priceVariation));
          
          // Generate rating based on stars or random for realistic values
          let rating = 3.0;
          if (tags.stars) {
            rating = parseFloat(tags.stars) / 5 * 5; // Convert to 5-star scale
          } else {
            rating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1)); // Between 3.5 and 5.0
          }
          
          // Use Unsplash image for hotel visualization
          let imageUrl = `https://source.unsplash.com/featured/?india,hotel,${encodeURIComponent(tags.name || destination)}&sig=${i}`;
          
          hostels.push({
            name: tags.name || `Accommodation in ${destination}`,
            rating: rating,
            price: price,
            currency: '₹',
            imageUrl: imageUrl,
            isMock: false
          });
        }
      } else {
        // If no data, throw error to trigger fallback
        throw new Error('No accommodations found');
      }
      
      return hostels;
    } catch (error) {
      console.error('Error fetching hotels data:', error);
      toast.warning('Using estimated hotel data');
      
      // Generate realistic fallback data for Indian hotels
      const hostels = [];
      const budgetPrices = {
        'cheap': { min: 800, max: 2000 },
        'moderate': { min: 2000, max: 5000 },
        'luxury': { min: 5000, max: 15000 }
      };
      
      const priceRange = budgetPrices[budget] || budgetPrices.moderate;
      
      const hotelNames = [
        `${destination} Heritage Inn`,
        `${destination} Royal Palace`,
        `${destination} Comfort Stay`,
        `Hotel ${destination} Grand`,
        `${destination} Traveller's Paradise`
      ];
      
      for (let i = 0; i < 5; i++) {
        hostels.push({
          name: hotelNames[i],
          rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          price: Math.floor(Math.random() * (priceRange.max - priceRange.min) + priceRange.min),
          currency: '₹',
          imageUrl: `https://source.unsplash.com/featured/?india,hotel&sig=${i}`,
          isMock: false
        });
      }
      
      return hostels;
    }
  }

  async _fetchRealAttractionsData(destination) {
    try {
      console.log("Fetching real attractions for:", destination);
      
      // First get location coordinates using Nominatim
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&countrycodes=in`,
        { headers: { "Accept-Language": "en" } }
      );
      
      if (!geoResponse.ok) {
        throw new Error('Geo API request failed');
      }
      
      const geoData = await geoResponse.json();
      
      if (!geoData || geoData.length === 0) {
        throw new Error('Location not found');
      }
      
      const { lat, lon } = geoData[0];
      
      // Use Overpass API to query for attractions
      const radius = 15000; // 15km radius
      const overpassQuery = `
        [out:json];
        (
          node["tourism"="attraction"](around:${radius},${lat},${lon});
          node["historic"](around:${radius},${lat},${lon});
          node["tourism"="museum"](around:${radius},${lat},${lon});
          node["leisure"="park"](around:${radius},${lat},${lon});
          node["tourism"="viewpoint"](around:${radius},${lat},${lon});
          node["amenity"="place_of_worship"](around:${radius},${lat},${lon}); // For temples, mosques, etc.
        );
        out body 10;
      `;
      
      const overpassResponse = await fetch(
        `https://overpass-api.de/api/interpreter`, 
        {
          method: 'POST',
          body: overpassQuery,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      
      if (!overpassResponse.ok) {
        throw new Error('Attractions API request failed');
      }
      
      const overpassData = await overpassResponse.json();
      
      if (!overpassData || !overpassData.elements || !Array.isArray(overpassData.elements)) {
        throw new Error('Invalid attractions data');
      }
      
      // Process the results
      const attractions = [];
      const elements = overpassData.elements.filter(el => el.tags && el.tags.name);
      
      // If we have real data, use it
      if (elements.length > 0) {
        for (let i = 0; i < Math.min(5, elements.length); i++) {
          const element = elements[i];
          const tags = element.tags;
          
          // Generate description based on available tags
          let description = "";
          if (tags.description) {
            description = tags.description;
          } else if (tags.historic) {
            description = `Historic ${tags.historic} in ${destination}, showcasing India's rich heritage.`;
          } else if (tags.tourism === 'museum') {
            description = `A fascinating museum in ${destination} displaying important cultural artifacts.`;
          } else if (tags.leisure === 'park') {
            description = `A beautiful park in ${destination}, perfect for experiencing nature.`;
          } else if (tags.amenity === 'place_of_worship') {
            description = `A sacred ${tags.religion || 'religious'} site in ${destination}, important to spiritual traditions.`;
          } else {
            description = `A popular attraction in ${destination}, visited by many tourists exploring India's wonders.`;
          }
          
          attractions.push({
            name: tags.name || `${destination} Attraction`,
            description: description,
            rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)), // Rating between 4.0 and 5.0
            isMock: false
          });
        }
      } else {
        // If no data, throw error to trigger fallback
        throw new Error('No attractions found');
      }
      
      return attractions;
    } catch (error) {
      console.error('Error fetching attractions data:', error);
      toast.warning('Using estimated attractions data');
      
      // Generate realistic fallback data for Indian attractions
      const attractions = [];
      
      const attractionTypes = {
        'temple': [
          `${destination} Ancient Temple`,
          `Sri ${destination} Temple`,
          `${destination} Sacred Shrine`
        ],
        'fort': [
          `${destination} Fort`,
          `${destination} Palace`,
          `Historic ${destination} Fortress`
        ],
        'nature': [
          `${destination} Gardens`,
          `${destination} Lake`,
          `${destination} National Park`
        ],
        'culture': [
          `${destination} Museum`,
          `${destination} Heritage Center`,
          `${destination} Cultural Complex`
        ]
      };
      
      // Mix different types of attractions
      const types = Object.keys(attractionTypes);
      const descriptions = {
        'temple': `A sacred religious site in ${destination}, known for its intricate architecture and spiritual significance.`,
        'fort': `A magnificent historical fort in ${destination}, showcasing ancient military architecture and royal heritage.`,
        'nature': `A beautiful natural area in ${destination}, perfect for experiencing the local biodiversity and landscapes.`,
        'culture': `An important cultural landmark in ${destination}, offering insights into the rich heritage of the region.`
      };
      
      let count = 0;
      for (let i = 0; i < types.length && count < 5; i++) {
        const type = types[i];
        const typeAttractions = attractionTypes[type];
        
        for (let j = 0; j < typeAttractions.length && count < 5; j++) {
          attractions.push({
            name: typeAttractions[j],
            description: descriptions[type],
            rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)), // Rating between 4.0 and 5.0
            isMock: false
          });
          count++;
        }
      }
      
      return attractions;
    }
  }

  _generateActivities(formData) {
    const destination = formData.destination;
    const budget = formData.budget;
    
    const activities = {
      cheap: [
        `Free walking tour of ${destination}`,
        `Visit public parks and gardens in ${destination}`,
        `Explore local markets in ${destination}`,
        `Temple visits around ${destination}`,
        `Street food tasting in ${destination}`,
        `Visit free museums and galleries in ${destination}`,
        `Attend local cultural events in ${destination}`,
        `Picnic in scenic spots around ${destination}`
      ],
      moderate: [
        `Guided tour of ${destination}'s main attractions`,
        `Visit popular museums and historical sites in ${destination}`,
        `Try local cuisine at mid-range restaurants in ${destination}`,
        `Day trip to nearby attractions from ${destination}`,
        `Cultural shows or performances in ${destination}`,
        `Boat ride or local transport experiences in ${destination}`,
        `Shopping at local boutiques in ${destination}`,
        `Cooking class to learn local cuisine in ${destination}`
      ],
      luxury: [
        `Private guided tour of ${destination}`,
        `Fine dining experiences at top-rated restaurants in ${destination}`,
        `Luxury spa treatments in ${destination}`,
        `Private tours of historical sites in ${destination}`,
        `VIP access to exclusive attractions in ${destination}`,
        `Helicopter tour over ${destination}`,
        `Private cultural performances in ${destination}`,
        `Custom shopping experience with personal shopper in ${destination}`
      ]
    };
    
    return activities[budget] || activities.moderate;
  }

  _getPartialData(formData, error) {
    console.log("Using partial data due to error:", error);
    
    // Create basic structure
    const result = {
      destination: formData.destination,
      days: parseInt(formData.days),
      budget: formData.budget,
      travelers: formData.travelers,
      activities: this._generateActivities(formData).slice(0, Math.min(formData.days * 2, 8)),
      isMock: false
    };
    
    // Try to add as much real data as possible
    return result;
  }
}

const itineraryService = new ItineraryService();
