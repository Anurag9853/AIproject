document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const travelForm = document.getElementById('travel-form');
  const submitButton = document.getElementById('submit-button');
  const destinationInput = document.getElementById('destination');
  const destinationSuggestions = document.getElementById('destination-suggestions');
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const resultState = document.getElementById('result-state');
  
  let selectedDestination = '';
  let isLoading = false;
  
  // Setup destination autocomplete
  destinationInput.addEventListener('input', () => {
    const value = destinationInput.value;
    
    if (value.length < 1) {
      destinationSuggestions.classList.add('hidden');
      return;
    }
    
    const filteredSuggestions = Utils.filterDestinations(value, popularIndianDestinations);
    
    if (filteredSuggestions.length > 0) {
      renderSuggestions(filteredSuggestions);
      destinationSuggestions.classList.remove('hidden');
    } else {
      destinationSuggestions.classList.add('hidden');
    }
  });
  
  destinationInput.addEventListener('focus', () => {
    if (destinationInput.value.length > 0) {
      const value = destinationInput.value;
      const filteredSuggestions = Utils.filterDestinations(value, popularIndianDestinations);
      
      if (filteredSuggestions.length > 0) {
        renderSuggestions(filteredSuggestions);
        destinationSuggestions.classList.remove('hidden');
      }
    }
  });
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target !== destinationInput && e.target !== destinationSuggestions) {
      destinationSuggestions.classList.add('hidden');
    }
  });
  
  function renderSuggestions(suggestions) {
    destinationSuggestions.innerHTML = '';
    
    const suggestionList = FormComponents.createSuggestionsList(suggestions, (suggestion) => {
      destinationInput.value = suggestion;
      destinationSuggestions.classList.add('hidden');
    });
    
    destinationSuggestions.appendChild(suggestionList);
  }
  
  // Handle form submission
  travelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    const formData = {
      destination: Utils.formatDestination(destinationInput.value),
      days: document.getElementById('days').value,
      budget: document.getElementById('budget').value,
      travelers: document.getElementById('travelers').value
    };
    
    // Validation
    if (!Utils.validateTravelForm(formData)) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Set UI state to loading
    setLoading(true);
    selectedDestination = formData.destination;
    
    try {
      toast.info(`Finding travel details for ${formData.destination}...`);
      const data = await itineraryService.fetchItineraryDetails(formData);
      renderItineraryResults(data);
      
      toast.success('Travel itinerary created with real data!');
    } catch (error) {
      console.error('Error fetching itinerary details:', error);
      toast.error('Failed to fetch itinerary details. Please try again.');
      setLoading(false);
      return;
    }
    
    setLoading(false);
  });
  
  function setLoading(loading) {
    isLoading = loading;
    
    if (loading) {
      submitButton.textContent = 'Generating Itinerary...';
      submitButton.disabled = true;
      loadingState.classList.remove('hidden');
      emptyState.classList.add('hidden');
      resultState.classList.add('hidden');
    } else {
      submitButton.textContent = 'Generate India Itinerary';
      submitButton.disabled = false;
      loadingState.classList.add('hidden');
    }
  }
  
  function renderItineraryResults(results) {
    if (!results) return;
    
    resultState.innerHTML = '';
    emptyState.classList.add('hidden');
    resultState.classList.remove('hidden');
    
    // Create main itinerary card
    const mainCard = createMainItineraryCard(results);
    resultState.appendChild(mainCard);
    
    // Create hostel section
    if (results.hostels && results.hostels.length > 0) {
      const hostelSection = createHostelSection(results.hostels, results.destination);
      resultState.appendChild(hostelSection);
    }
    
    // Create attractions section
    if (results.attractions && results.attractions.length > 0) {
      const attractionsSection = createAttractionsSection(results.attractions, results.destination);
      resultState.appendChild(attractionsSection);
    }
    
    // Re-render feather icons
    feather.replace();
  }
  
  // Component rendering functions - separated from the main logic
  function createMainItineraryCard(results) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow overflow-hidden';
    
    // Card header
    const header = document.createElement('div');
    header.className = 'p-6 border-b';
    
    const headerContent = `
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-bold">Your Customized Itinerary</h2>
          <p class="text-gray-500">Personalized travel plan for your trip to ${results.destination}</p>
        </div>
        ${results.weather ? `
          <div class="flex flex-col items-end">
            <div class="flex items-center gap-2">
              <i data-feather="${results.weather.icon}" class="text-blue-500" style="width: 20px; height: 20px;"></i>
              <span class="font-medium">${results.weather.temperature}°C</span>
            </div>
            <span class="text-sm text-gray-500">${results.weather.condition}</span>
          </div>
        ` : ''}
      </div>
    `;
    
    header.innerHTML = headerContent;
    card.appendChild(header);
    
    // Card content
    const content = document.createElement('div');
    content.className = 'p-6';
    
    const contentHTML = `
      <div class="space-y-3 mb-6">
        <div class="flex items-center gap-2">
          <i data-feather="map-pin" class="text-blue-500" style="width: 20px; height: 20px;"></i>
          <span><strong>Destination:</strong> ${results.destination}</span>
        </div>
        <div class="flex items-center gap-2">
          <i data-feather="calendar" class="text-blue-500" style="width: 20px; height: 20px;"></i>
          <span><strong>Duration:</strong> ${results.days} days</span>
        </div>
        <div class="flex items-center gap-2">
          <i data-feather="dollar-sign" class="text-blue-500" style="width: 20px; height: 20px;"></i>
          <span><strong>Budget:</strong> ${results.budget}</span>
        </div>
        <div class="flex items-center gap-2">
          <i data-feather="users" class="text-blue-500" style="width: 20px; height: 20px;"></i>
          <span><strong>Traveling with:</strong> ${results.travelers.replace('-', ' ')}</span>
        </div>
      </div>
      
      <div class="border-t pt-4">
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <i data-feather="activity" class="text-blue-500" style="width: 20px; height: 20px;"></i>
          Suggested Activities:
        </h3>
        <ul class="list-disc pl-6 space-y-2">
          ${results.activities && results.activities.map((activity) => `
            <li class="text-gray-700">${activity}</li>
          `).join('')}
        </ul>
      </div>
    `;
    
    content.innerHTML = contentHTML;
    card.appendChild(content);
    
    return card;
  }
  
  function createHostelSection(hostels, destination) {
    const section = document.createElement('div');
    section.className = 'mt-6';
    
    const headerHtml = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xl font-semibold flex items-center gap-2">
          <i data-feather="home" class="text-blue-500" style="width: 20px; height: 20px;"></i>
          Recommended Accommodations
        </h3>
      </div>
    `;
    
    section.innerHTML = headerHtml;
    
    const hostelGrid = document.createElement('div');
    hostelGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    
    hostels.forEach(hostel => {
      const hostelCard = document.createElement('div');
      hostelCard.className = 'bg-white rounded-lg shadow overflow-hidden';
      
      const hostelHtml = `
        <div class="h-48 overflow-hidden relative">
          <img 
            src="${hostel.imageUrl}" 
            alt="${hostel.name}" 
            class="w-full h-full object-cover transition-transform hover:scale-105"
            onerror="this.src='https://source.unsplash.com/featured/?india,hotel'"
          />
        </div>
        <div class="p-4">
          <h4 class="text-lg font-medium mb-2">${hostel.name}</h4>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold">
                ${hostel.rating.toFixed(1)}
              </span>
              <span class="text-sm text-gray-500 ml-2">Rating</span>
            </div>
            <div class="font-semibold">
              ${hostel.price} ${hostel.currency}
              <span class="text-sm text-gray-500 ml-1">/ night</span>
            </div>
          </div>
        </div>
      `;
      
      hostelCard.innerHTML = hostelHtml;
      hostelGrid.appendChild(hostelCard);
    });
    
    section.appendChild(hostelGrid);
    return section;
  }
  
  function createAttractionsSection(attractions, destination) {
    const section = document.createElement('div');
    section.className = 'mt-6';
    
    const headerHtml = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xl font-semibold flex items-center gap-2">
          <i data-feather="map-pin" class="text-blue-500" style="width: 20px; height: 20px;"></i>
          Top Attractions in ${destination.split(',')[0].trim()}
        </h3>
      </div>
    `;
    
    section.innerHTML = headerHtml;
    
    const attractionsList = document.createElement('div');
    attractionsList.className = 'space-y-4';
    
    attractions.forEach(attraction => {
      const attractionCard = document.createElement('div');
      attractionCard.className = 'bg-white rounded-lg shadow overflow-hidden';
      
      const attractionHtml = `
        <div class="p-4">
          <div class="flex justify-between items-center mb-2">
            <h4 class="text-lg font-medium">${attraction.name}</h4>
            <div class="flex items-center">
              <span class="bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold">
                ${attraction.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <p class="text-gray-700">${attraction.description}</p>
        </div>
      `;
      
      attractionCard.innerHTML = attractionHtml;
      attractionsList.appendChild(attractionCard);
    });
    
    section.appendChild(attractionsList);
    return section;
  }
});
