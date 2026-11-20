(() => {
  const next = new URL('index.html', location.href);
  next.search = location.search;
  if (!next.searchParams.has('board')) next.searchParams.set('board', '전체글');
  next.hash = '#latest';
  location.replace(next.href);
})();
