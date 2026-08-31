document.addEventListener('DOMContentLoaded', function () {
  var NOTIFY_EMAIL = 'rrrick1324@gmail.com';

  var form = document.getElementById('booking-form');
  var formView = document.getElementById('form-view');
  var successView = document.getElementById('success-view');
  var contactHint = document.getElementById('contact-hint');
  var contactError = document.getElementById('contact-error');
  var resetBtn = document.getElementById('reset-btn');

  function showError() {
    contactHint.style.display = 'none';
    contactError.style.display = 'flex';
  }
  function clearError() {
    contactHint.style.display = 'block';
    contactError.style.display = 'none';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form);
    var g = function (k) { return (f.get(k) || '').toString().trim(); };

    if (!g('phone') && !g('email')) {
      showError();
      var phoneEl = document.getElementById('bk-phone');
      if (phoneEl) phoneEl.focus();
      return;
    }
    clearError();

    var rows = [
      ['Name', g('name')],
      ['Phone', g('phone')],
      ['Email', g('email')],
      ['Service', g('service')],
      ['City', g('city')],
      ['Piano', g('pianoType')],
      ['Last tuned', g('lastTuned')],
      ['Preferred time', g('preferred')]
    ].filter(function (r) { return r[1]; });

    var body = 'New service request from the website\n\n';
    body += rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
    if (g('notes')) body += '\n\nNotes:\n' + g('notes');

    var subject = 'Service request — ' + (g('service') || 'Piano service') +
      ' — ' + (g('name') || 'Website') + (g('city') ? ', ' + g('city') : '');

    window.location.href = 'mailto:' + NOTIFY_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    formView.style.display = 'none';
    successView.style.display = 'block';
  });

  resetBtn.addEventListener('click', function () {
    form.reset();
    clearError();
    successView.style.display = 'none';
    formView.style.display = 'block';
  });
});
