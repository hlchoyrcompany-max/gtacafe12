(() => {
  const menu = document.querySelector('.cafe-mobile-menu');
  const drawer = document.getElementById('cafe-mobile-drawer');
  const navigation = document.querySelector('.cafe-sidebar nav').cloneNode(true);

  navigation.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
  const members = document.querySelector('.cafe-members').firstElementChild.cloneNode(true);
  drawer.querySelector('.cafe-mobile-drawer-links').append(members, navigation);
  menu.addEventListener('click', () => drawer.showModal());
  drawer.addEventListener('click', event => {
    if (event.target === drawer) drawer.close();
  });
  matchMedia('(min-width: 768px)').addEventListener('change', event => {
    if (event.matches && drawer.open) drawer.close();
  });
})();
