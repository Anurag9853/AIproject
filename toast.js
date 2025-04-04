
class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  // Create toast HTML element with appropriate styling
  createToastElement(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Create icon element
    const icon = document.createElement('div');
    icon.className = 'float-left mr-3';
    
    // Determine which icon to use based on toast type
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';
    if (type === 'warning') iconName = 'alert-triangle';
    
    icon.innerHTML = `<i data-feather="${iconName}"></i>`;
    
    // Create content element
    const content = document.createElement('div');
    content.textContent = message;
    
    // Assemble the toast
    toast.appendChild(icon);
    toast.appendChild(content);
    
    return toast;
  }

  // Show a toast notification
  show(message, type = 'info', duration = 3000) {
    // Create the toast element
    const toast = this.createToastElement(message, type);
    this.container.appendChild(toast);
    
    // Render the icon using feather
    feather.replace();
    
    // Animation: show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Animation: hide toast after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        this.container.removeChild(toast);
      }, 300);
    }, duration);
  }
  
  // Helper methods for different toast types
  success(message, duration) {
    this.show(message, 'success', duration);
  }
  
  error(message, duration) {
    this.show(message, 'error', duration);
  }
  
  info(message, duration) {
    this.show(message, 'info', duration);
  }
  
  warning(message, duration) {
    this.show(message, 'warning', duration);
  }
}

// Initialize toast manager
const toast = new ToastManager();
