// Geolocation Utilities
const GeolocationUtils = {
    // Get current position with promise
    getCurrentPosition(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
                ...options
            });
        });
    },
    
    // Watch position
    watchPosition(callback, options = {}) {
        if (!navigator.geolocation) {
            Toast.show('Geolocation not supported', 'error');
            return null;
        }
        
        return navigator.geolocation.watchPosition(callback, (error) => {
            console.error('Watch position error:', error);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            ...options
        });
    },
    
    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },
    
    toRad(degrees) {
        return degrees * Math.PI / 180;
    },
    
    // Format distance for display
    formatDistance(distance) {
        if (distance < 1) {
            return `${Math.round(distance * 1000)} m`;
        }
        return `${distance.toFixed(1)} km`;
    },
    
    // Get address from coordinates (reverse geocoding)
    async getAddressFromCoords(lat, lon) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            throw error;
        }
    },
    
    // Get coordinates from address (geocoding)
    async getCoordsFromAddress(address) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };
            }
            throw new Error('Address not found');
        } catch (error) {
            console.error('Geocoding error:', error);
            throw error;
        }
    },
    
    // Check if a location is within a certain radius
    isWithinRadius(userLat, userLon, targetLat, targetLon, radiusKm) {
        const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
        return distance <= radiusKm;
    }
};

// Make it globally available
window.GeolocationUtils = GeolocationUtils;