// Aplica el tema guardado antes del primer pintado para evitar el parpadeo de color.
(function () {
  var THEMES = {
    rosa: '#fff8f8',
    menta: '#f3fbf7',
    cielo: '#f5f9fe',
    lavanda: '#faf7ff',
    durazno: '#fef8f4',
    salvia: '#f8fcf6',
    arena: '#fdfaf5',
    oceano: '#f4fcfd'
  };
  var theme = 'rosa';
  try {
    var saved = localStorage.getItem('mibebe_theme');
    if (saved && Object.prototype.hasOwnProperty.call(THEMES, saved)) theme = saved;
  } catch (e) { /* almacenamiento no disponible */ }
  document.documentElement.setAttribute('data-theme', theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEMES[theme]);
})();
