(() => {
  const core = window.BlogCore;
  const posts = window.CAFE_EXAMPLE_POSTS;
  const params = new URLSearchParams(location.search);
  const requested = params.get('board');
  const board = ['전체글', '인기글', '공지'].includes(requested) ? requested : '전체글';
  const rows = document.getElementById('home-rows');
  const input = document.getElementById('home-query');
  const pagination = document.getElementById('home-pagination');
  const pageSize = 10;
  let page = Number(params.get('page')) || 1;
  let query = params.get('q') || '';
  const integer = new Intl.NumberFormat('ko-KR');
  const boardTitle = {전체글: '전체글보기', 인기글: '인기글', 공지: '공지사항'};
  document.getElementById('board-title').textContent = boardTitle[board];
  input.value = query;

  for (const tab of document.querySelectorAll('[data-board]')) {
    if (tab.dataset.board === board) tab.setAttribute('aria-current', 'page');
  }

  function href(nextPage, example) {
    const next = new URLSearchParams({board});
    if (nextPage > 1) next.set('page', String(nextPage));
    if (query) next.set('q', query);
    if (example) next.set('example', example);
    return '?' + next + (example ? '#home-example' : '#latest');
  }

  function addPageLink(number, label) {
    const link = document.createElement('a');
    link.href = href(number);
    link.textContent = label;
    if (number === page && label === String(number)) link.setAttribute('aria-current', 'page');
    pagination.append(link);
  }

  function renderPinned() {
    if (requested || query || page !== 1) return;
    const pinned = document.getElementById('home-mobile-pinned');
    for (const post of core.filterPosts(posts, '공지').slice(0, 2)) {
      const link = document.createElement('a');
      const badge = document.createElement('span');
      badge.textContent = '필독';
      link.href = href(1, post.id);
      link.append(badge, post.title);
      pinned.append(link);
    }
    pinned.hidden = false;
  }

  function render() {
    const results = core.filterPosts(posts, board, query);
    if (!requested && !query) results.sort((a, b) => Number(a.category === "공지") - Number(b.category === "공지"));
    const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
    page = Math.min(totalPages, Math.max(1, Math.floor(page)));
    rows.replaceChildren();
    for (const post of results.slice((page - 1) * pageSize, page * pageSize)) {
      const row = rows.insertRow();
      const link = document.createElement('a');
      link.href = href(page, post.id);
      link.textContent = post.title;
      const titleCell = row.insertCell();
      titleCell.append(link);
      const commentCount = post.likes % 6;
      if (post.category !== '공지' && commentCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'home-mobile-comments';
        const count = document.createElement('strong');
        count.textContent = commentCount;
        badge.append(count, '댓글');
        titleCell.append(badge);
      }
      for (const value of [post.author, post.date.replaceAll('-', '.') + '.', integer.format(post.views), integer.format(post.likes)]) {
        row.insertCell().textContent = value;
      }
    }
    if (!results.length) {
      const cell = rows.insertRow().insertCell();
      cell.colSpan = 5;
      cell.className = 'home-empty';
      cell.textContent = '검색 결과가 없습니다.';
    }
    pagination.replaceChildren();
    pagination.hidden = totalPages === 1;
    if (page > 1) addPageLink(page - 1, '이전');
    const first = 1 + Math.floor((page - 1) / 10) * 10;
    for (let number = first; number <= Math.min(first + 9, totalPages); number++) addPageLink(number, String(number));
    if (page < totalPages) addPageLink(page + 1, '다음');
    if (first + 9 < totalPages) addPageLink(first + 10, '다음 10페이지');
  }

  const sample = core.getPost(posts, params.get('example'));
  if (sample) {
    document.getElementById('latest').hidden = true;
    document.getElementById('home-example').hidden = false;
    document.getElementById('example-title').textContent = sample.title;
    document.getElementById('example-meta').textContent =
      `${sample.author} · ${sample.date} · 조회 ${integer.format(sample.views)} · 좋아요 ${integer.format(sample.likes)}`;
    document.getElementById('example-body').textContent = sample.description;
    document.getElementById('example-back').href = href(page);
    return;
  }

  document.getElementById('home-search').addEventListener('submit', event => {
    event.preventDefault();
    query = input.value.trim();
    location.href = href(1);
  });
  renderPinned();
  render();
})();
