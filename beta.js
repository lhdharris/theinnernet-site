/* The beta form: the address sent straight to Innernet (no mail app), and
   the form replaced by a thank-you. The hidden "website" field is for bots,
   which fill in every field; people never see it. */
(function () {
  var form = document.querySelector('form.beta');
  if (!form) return;
  var note = document.createElement('p');
  note.className = 'quiet beta-note';
  note.setAttribute('role', 'status');
  form.after(note);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var button = form.querySelector('button');
    button.disabled = true;
    note.textContent = '';
    fetch('https://api.theinnernet.co/v1/beta/request', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ email: form.email.value, website: form.website.value })
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error((data.error && data.error.message) || 'Something went wrong; try again.');
        });
      })
      .then(function () {
        form.remove();
        note.textContent = 'Thanks! We’ll be in touch.';
      })
      .catch(function (err) {
        button.disabled = false;
        note.textContent = err.message && err.message !== 'Failed to fetch'
          ? err.message
          : 'Couldn’t send it just now; try again in a moment.';
      });
  });
})();
