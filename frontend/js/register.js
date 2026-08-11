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

      const data = await response.json();

      if (data.success) {
        registerMessage.style.color = '#1C8A4B';
        registerMessage.textContent = data.message;
        registerForm.reset();
        fetchRegistrations();
      } else {
        registerMessage.style.color = '#D6304A';
        registerMessage.textContent = data.message;
      }
    } catch (error) {
      console.error('Registration error:', error);
      registerMessage.style.color = '#D6304A';
      registerMessage.textContent = 'Could not process registration.';
    }
  });

  async function fetchRegistrations() {
    try {
      const response = await fetch('/api/registrations');
      const data = await response.json();

      if (data.success && data.registrations.length > 0) {
        renderRegistrations(data.registrations);
      } else {
        registrationsList.innerHTML = '<p style="text-align:center; width:100%;">No event registrations found yet.</p>';
      }
    } catch (error) {
      console.error('Fetch error:', error);
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
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[match]);
  }
});