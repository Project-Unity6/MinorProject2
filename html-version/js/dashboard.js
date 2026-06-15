// API Configuration - same server, use relative path
const API_BASE_URL = '/api';

// Selected lot for booking
let selectedLot = null;

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Check if user is logged in
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }

    // Display user name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = document.getElementById('userName');
    if (userName && user.name) {
        userName.textContent = user.name;
    }
    return true;
}

// API call helper
async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load parking lots
async function loadParkingLots(query = '', pinCode = '') {
    try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (pinCode) params.append('pin_code', pinCode);

        const lots = await apiCall(`/parking/search?${params}`);
        renderParkingLots(lots);
    } catch (error) {
        console.error('Error loading parking lots:', error);
        showAlert('Failed to load parking lots', 'error');
    }
}

// Render parking lots with dynamic pricing
function renderParkingLots(lots) {
    const container = document.getElementById('parkingLotsContainer');

    if (lots.length === 0) {
        container.innerHTML = `
            <div class="card" style="padding: 3rem; text-align: center;">
                <p style="color: hsl(var(--muted-foreground));">No parking lots found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = lots.map(lot => {
        const isSurge = lot.price_multiplier > 1;
        const surgeLabel = lot.price_multiplier >= 2 ? '🔥 High Demand' :
            lot.price_multiplier >= 1.5 ? '📈 Surge Pricing' :
                lot.price_multiplier > 1 ? '💹 Busy' : '';

        return `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${lot.name}</h3>
                    <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">${lot.address}, ${lot.city}</p>
                    <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">PIN: ${lot.pin_code}</p>
                </div>
                <div style="text-align: right;">
                    ${isSurge ? `
                        <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: hsl(var(--destructive) / 0.1); color: hsl(var(--destructive)); border-radius: 4px; display: inline-block; margin-bottom: 0.25rem;">
                            ${surgeLabel}
                        </span>
                        <div style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); text-decoration: line-through;">₹${lot.base_rate}/hr</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: hsl(var(--destructive));">₹${lot.dynamic_rate}/hr</div>
                    ` : `
                        <div style="font-size: 1.5rem; font-weight: 700; color: hsl(var(--primary));">₹${lot.dynamic_rate || lot.hourly_rate}/hr</div>
                    `}
                </div>
            </div>
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <div style="flex: 1; padding: 0.75rem; background: hsl(var(--secondary)); border-radius: var(--radius); text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: hsl(142 76% 36%);">${lot.available_spots || 0}</div>
                    <div style="font-size: 0.75rem; color: hsl(var(--muted-foreground));">Available</div>
                </div>
                <div style="flex: 1; padding: 0.75rem; background: hsl(var(--secondary)); border-radius: var(--radius); text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: hsl(var(--destructive));">${lot.occupied_spots || 0}</div>
                    <div style="font-size: 0.75rem; color: hsl(var(--muted-foreground));">Occupied</div>
                </div>
                <div style="flex: 1; padding: 0.75rem; background: hsl(var(--secondary)); border-radius: var(--radius); text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700;">${lot.occupancy_percent || 0}%</div>
                    <div style="font-size: 0.75rem; color: hsl(var(--muted-foreground));">Occupancy</div>
                </div>
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick='openBookingModal(${JSON.stringify(lot)})' ${lot.available_spots === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                ${lot.available_spots === 0 ? 'No Spots Available' : 'Book Now →'}
            </button>
        </div>
    `}).join('');
}

// Open booking confirmation modal
function openBookingModal(lot) {
    selectedLot = lot;

    document.getElementById('modalLotName').textContent = lot.name;
    document.getElementById('modalLotAddress').textContent = `${lot.address}, ${lot.city}`;

    // Show dynamic rate
    const isSurge = lot.price_multiplier > 1;
    if (isSurge) {
        document.getElementById('modalHourlyRate').innerHTML = `
            <span style="text-decoration: line-through; color: hsl(var(--muted-foreground)); font-size: 0.875rem;">₹${lot.base_rate}</span>
            <span style="color: hsl(var(--destructive)); font-weight: 700;">₹${lot.dynamic_rate}/hr</span>
            <span style="font-size: 0.75rem; color: hsl(var(--destructive));">(${lot.price_multiplier}x surge)</span>
        `;
    } else {
        document.getElementById('modalHourlyRate').textContent = `₹${lot.dynamic_rate || lot.hourly_rate}/hr`;
    }

    document.getElementById('modalAvailableSpots').textContent = `${lot.available_spots} (${lot.occupancy_percent}% full)`;
    document.getElementById('modalEstimatedCost').textContent = `₹${lot.dynamic_rate || lot.hourly_rate}`;

    // Get user's vehicle number
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('modalVehicleNumber').value = user.vehicle_number || '';

    document.getElementById('bookingModal').classList.add('active');
}

// Close booking modal
function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('active');
    selectedLot = null;
    document.getElementById('modalAlert').innerHTML = '';
}

// Confirm booking
async function confirmBooking() {
    if (!selectedLot) return;

    const vehicleNumber = document.getElementById('modalVehicleNumber').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    if (!vehicleNumber) {
        document.getElementById('modalAlert').innerHTML = '<div class="alert alert-error">Please enter vehicle number</div>';
        return;
    }

    try {
        const booking = await apiCall('/bookings', {
            method: 'POST',
            body: JSON.stringify({
                lot_id: selectedLot.id,
                vehicle_number: vehicleNumber,
                payment_method: paymentMethod
            })
        });

        closeBookingModal();
        showAlert('🎉 Booking confirmed successfully!', 'success');

        // Refresh parking lots and switch to bookings tab
        loadParkingLots();
        setTimeout(() => {
            document.querySelector('[data-tab="bookings"]').click();
        }, 1500);
    } catch (error) {
        document.getElementById('modalAlert').innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
}

// Payment option selection
document.querySelectorAll('.payment-option').forEach(option => {
    option.addEventListener('click', function () {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        this.querySelector('input').checked = true;
    });
});

// Load active bookings
async function loadActiveBookings() {
    const container = document.getElementById('activeBookingsContainer');

    try {
        const bookings = await apiCall('/bookings?status=ACTIVE');

        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="card" style="padding: 3rem; text-align: center;">
                    <p style="color: hsl(var(--muted-foreground)); font-size: 1.125rem;">No active bookings</p>
                    <button class="btn btn-primary" style="margin-top: 1rem;" onclick="document.querySelector('[data-tab=search]').click()">
                        Search for parking
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="card" style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">
                            Spot: ${booking.spot_id} | Lot: ${booking.lot_id}
                        </h3>
                        <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">
                            Started: ${new Date(booking.start_time).toLocaleString()}
                        </p>
                        <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">
                            Vehicle: ${booking.vehicle_number}
                        </p>
                        <p style="color: hsl(var(--primary)); font-size: 0.875rem; font-weight: 600;">
                            Duration: ${getElapsedTime(booking.start_time)}
                        </p>
                    </div>
                    <button class="btn btn-primary" onclick="releaseBooking(${booking.id})">
                        End Parking
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<div class="card"><p class="alert alert-error">${error.message}</p></div>`;
    }
}

// Calculate elapsed time
function getElapsedTime(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000 / 60); // minutes

    if (diff < 60) return `${diff} min`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
}

// Load booking history
async function loadBookingHistory() {
    const container = document.getElementById('historyContainer');

    try {
        const bookings = await apiCall('/bookings?status=COMPLETED');

        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="card" style="padding: 3rem; text-align: center;">
                    <p style="color: hsl(var(--muted-foreground)); font-size: 1.125rem;">No booking history</p>
                </div>
            `;
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="card" style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">
                            Booking #${booking.id}
                        </h3>
                        <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">
                            ${new Date(booking.start_time).toLocaleDateString()} | Vehicle: ${booking.vehicle_number}
                        </p>
                        <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">
                            Duration: ${booking.duration_minutes || 0} minutes
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: hsl(var(--primary));">
                            ₹${Number(booking.total_cost || 0).toFixed(2)}
                        </div>
                        <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: hsl(142 76% 36% / 0.1); color: hsl(142 76% 36%); border-radius: 4px;">
                            Completed
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<div class="card"><p class="alert alert-error">${error.message}</p></div>`;
    }
}

// Release booking
async function releaseBooking(bookingId) {
    if (!confirm('Are you sure you want to end this parking session?')) {
        return;
    }

    try {
        const result = await apiCall(`/bookings/${bookingId}/release`, { method: 'POST' });
        showAlert(`Parking ended! Total cost: ₹${Number(result.total_cost || 0).toFixed(2)}`, 'success');
        loadActiveBookings();
        loadParkingLots();
    } catch (error) {
        showAlert(error.message || 'Failed to end parking session', 'error');
    }
}

// Show alert
function showAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '1rem';
    alertDiv.style.right = '1rem';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '400px';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    // Load initial data
    loadParkingLots();

    // Search form
    const searchBtn = document.getElementById('searchBtn');
    const locationInput = document.getElementById('searchLocation');
    const pinCodeInput = document.getElementById('searchPinCode');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            loadParkingLots(locationInput?.value || '', pinCodeInput?.value || '');
        });
    }

    // Tab event listeners
    document.querySelector('[data-tab="bookings"]')?.addEventListener('click', loadActiveBookings);
    document.querySelector('[data-tab="history"]')?.addEventListener('click', loadBookingHistory);
});
