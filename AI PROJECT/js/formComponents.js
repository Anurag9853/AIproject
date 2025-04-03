
/**
 * UI Components for rendering form elements
 */

const FormComponents = {
  /**
   * Creates a suggestion list for destination input
   * @param {Array} suggestions - List of destination suggestions
   * @param {Function} onSelect - Callback when a suggestion is selected
   * @returns {HTMLElement} The suggestion list element
   */
  createSuggestionsList(suggestions, onSelect) {
    const container = document.createElement('div');
    
    suggestions.forEach((suggestion) => {
      const item = document.createElement('div');
      item.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer';
      item.textContent = suggestion;
      
      item.addEventListener('click', () => {
        onSelect(suggestion);
      });
      
      container.appendChild(item);
    });
    
    return container;
  },
  
  /**
   * Creates a card element for displaying itinerary information
   * @param {Object} config - Configuration for the card
   * @returns {HTMLElement} The card element
   */
  createCard(config) {
    const { title, content, className = '' } = config;
    
    const card = document.createElement('div');
    card.className = `bg-white rounded-lg shadow overflow-hidden ${className}`;
    
    if (title) {
      const header = document.createElement('div');
      header.className = 'p-6 border-b';
      header.innerHTML = title;
      card.appendChild(header);
    }
    
    if (content) {
      const body = document.createElement('div');
      body.className = 'p-6';
      body.innerHTML = content;
      card.appendChild(body);
    }
    
    return card;
  }
};
