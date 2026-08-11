document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const registerMessage = document.getElementById('registerMessage');
  const registrationsList = document.getElementById('registrationsList');

  fetchRegistrations();

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const event = document.getElementById('eventSelect').value;
    const tickets = document.getElementById('tickets').value;
    const notes = document.getElementById('notes').value.trim();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, event, tickets, notes })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        registerMessage.style.color = '#1C8A4B';
        registerMessage.textContent = data.message;
        registerForm.reset();
        fetchRegistrations();
      } else {
        registerMessage.style.color = '#D6304A';
        registerMessage.textContent = data.message || 'Registration failed.';
      }
    } catch (error) {
      console.error('Registration error details:', error);
      registerMessage.style.color = '#D6304A';
      registerMessage.textContent = 'Could not process registration.';
    }
  });

  registrationsList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const id = e.target.getAttribute('data-id');

      if (!confirm('Are you sure you want to cancel this registration?')) {
        return;
      }

      try {
        const response = await fetch(`/api/registrations/${id}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          fetchRegistrations();
        } else {
          alert(data.message || 'Failed to remove registration.');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Server error while removing registration.');
      }
    }
  });

  async function fetchRegistrations() {
    try {
      const response = await fetch('/api/registrations');
      if (!response.ok) return;

      const data = await response.json();

      if (data.success && data.registrations && data.registrations.length > 0) {
        renderRegistrations(data.registrations);
      } else {
        registrationsList.innerHTML = '<p style="text-align:center; width:100%;">No event registrations found yet.</p>';
      }
    } catch (error) {
      console.error('Fetch registrations error:', error);
    }
  }

  function renderRegistrations(items) {
    registrationsList.innerHTML = items.map(item => `
      <div class="card">
        <div class="card-body">
          <span class="tag">Registered</span>
          <h3>${escapeHtml(item.event)}</h3>
          <p><strong>Name:</strong> ${escapeHtml(item.full_name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(item.email)}</p>
          <p><strong>Tickets:</strong> ${item.tickets}</p>
          ${item.notes ? `<p><strong>Notes:</strong> ${escapeHtml(item.notes)}</p>` : ''}
          <button class="btn delete-btn" data-id="${item.id}" style="margin-top: 12px; width: 100%; background-color: #D6304A; color: white; border: none; padding: 8px 0; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Remove Registration
          </button>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[match]);
  }
});