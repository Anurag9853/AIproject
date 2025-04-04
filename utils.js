
/**
 * Utility functions for the travel planner
 */

const Utils = {
  /**
   * Filters an array of destinations based on input value
   * @param {string} value - The input value to filter by
   * @param {Array} destinations - Array of destination strings
   * @returns {Array} Filtered destinations
   */
  filterDestinations(value, destinations) {
    const lowercaseValue = value.toLowerCase();
    return destinations.filter(
      dest => dest.toLowerCase().includes(lowercaseValue)
    );
  },
  
  /**
   * Formats a destination string to include "India" if not present
   * @param {string} destination - Destination input
   * @returns {string} Formatted destination
   */
  formatDestination(destination) {
    return destination.includes('India') 
      ? destination 
      : `${destination}, India`;
  },
  
  /**
   * Validate form data
   * @param {Object} formData - The form data to validate
   * @returns {boolean} Whether the form is valid
   */
  validateTravelForm(formData) {
    return !!(formData.destination && formData.days && formData.budget && formData.travelers);
  },
  
  /**
   * Creates HTML for displaying weather information
   * @param {Object} weather - Weather data object
   * @returns {string} HTML string for weather display
   */
  createWeatherHTML(weather) {
    if (!weather) return '';
    
    return `
      <div class="flex items-center gap-2">
        <i data-feather="${weather.icon}" class="text-blue-500" style="width: 20px; height: 20px;"></i>
        <span class="font-medium">${weather.temperature}°C</span>
      </div>
      <span class="text-sm text-gray-500">${weather.condition}</span>
    `;
  }
};
